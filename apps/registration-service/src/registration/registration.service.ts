// Handles signup, payment, and the registration lifecycle. A free event is
// CONFIRMED on creation; a paid one stays PENDING until Stripe calls back at
// /webhook/stripe. Confirmation/payment/registration emails are sent through
// email-service and are best-effort — they never block the signup.
import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import * as QRCode from 'qrcode';
import { Registration, FormField, Event } from '@event-platform/database';
import { RegistrationStatus, EventStatus } from '@event-platform/shared';
import { RulesEngineService } from '../rules-engine/rules-engine.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(FormField)
    private readonly formFieldRepo: Repository<FormField>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly rulesEngine: RulesEngineService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async create(
    dto: CreateRegistrationDto,
    opts: { enforcePublished?: boolean } = {},
  ): Promise<Registration> {
    const event = await this.eventRepo.findOne({ where: { id: dto.eventId } });
    if (!event) throw new NotFoundException(`Event #${dto.eventId} not found`);

    // Public self-registration is only allowed once an event is live.
    if (opts.enforcePublished && ![EventStatus.PUBLISHED, EventStatus.ONGOING].includes(event.status)) {
      throw new BadRequestException('This event is not open for registration yet');
    }

    const existing = await this.registrationRepo.findOne({
      where: { eventId: dto.eventId, userId: dto.userId },
    });
    if (existing) throw new BadRequestException('Already registered for this event');

    const formFields = await this.formFieldRepo.find({ where: { eventId: dto.eventId } });
    const rules = formFields.flatMap((f) => f.conditionalLogic?.rules || []);

    const result = this.rulesEngine.evaluateForm(rules, {
      user: dto.userData || {},
      event: dto.eventData || {},
      formData: dto.formData || {},
    }, dto.basePrice || 0);

    if (!result.isValid) {
      throw new BadRequestException({ message: 'Form validation failed', errors: result.errors });
    }

    // Timestamp keeps re-issued codes for the same (event, user) pair distinct.
    // We store the raw payload for verification and a data-URL PNG for the email.
    const qrPayload = JSON.stringify({ eventId: dto.eventId, userId: dto.userId, timestamp: Date.now() });
    const qrCodeUrl = await QRCode.toDataURL(qrPayload);

    const registration = this.registrationRepo.create({
      eventId: dto.eventId,
      userId: dto.userId,
      formData: result.updatedFormData,
      amountPaid: result.finalPrice,
      pricingTier: result.pricingTier,
      qrCode: qrPayload,
      qrCodeUrl,
      status: result.finalPrice > 0 ? RegistrationStatus.PENDING : RegistrationStatus.CONFIRMED,
    });

    const saved = await this.registrationRepo.save(registration);
    this.logger.log(`Registration ${saved.id} created for user ${dto.userId} at event ${dto.eventId}`);

    // Free events are confirmed right away, so send the ticket (with QR) now.
    // Paid events only get an acknowledgement here; the receipt + confirmation
    // go out after the Stripe webhook lands.
    if (saved.status === RegistrationStatus.CONFIRMED) {
      await this.sendConfirmationEmail(saved.id);
    } else {
      await this.sendRegistrationEmail(saved.id);
    }

    return saved;
  }

  findByEvent(eventId: number): Promise<Registration[]> {
    return this.registrationRepo.find({
      where: { eventId },
      relations: { user: true },
      order: { registrationDate: 'DESC' },
    });
  }

  findByUser(userId: number): Promise<Registration[]> {
    return this.registrationRepo.find({
      where: { userId },
      relations: { event: true },
      order: { registrationDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Registration> {
    const reg = await this.registrationRepo.findOne({
      where: { id },
      relations: { user: true, event: true },
    });
    if (!reg) throw new NotFoundException(`Registration #${id} not found`);
    return reg;
  }

  async confirm(id: number): Promise<Registration> {
    const reg = await this.findOne(id);
    reg.status = RegistrationStatus.CONFIRMED;
    reg.confirmedAt = new Date();
    const saved = await this.registrationRepo.save(reg);
    await this.sendConfirmationEmail(saved.id);
    return saved;
  }

  async cancel(id: number): Promise<Registration> {
    const reg = await this.findOne(id);
    if (reg.status === RegistrationStatus.CHECKED_IN) {
      throw new BadRequestException('Cannot cancel a checked-in registration');
    }
    reg.status = RegistrationStatus.CANCELLED;
    reg.cancelledAt = new Date();
    return this.registrationRepo.save(reg);
  }

  // Amount is in cents (Stripe's smallest unit). The client confirms the card
  // with the returned clientSecret, so the secret key never touches the browser.
  async createPaymentIntent(id: number): Promise<{ clientSecret: string }> {
    const reg = await this.findOne(id);
    if (reg.amountPaid <= 0) throw new BadRequestException('No payment required');

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(reg.amountPaid * 100),
      currency: 'usd',
      metadata: { registrationId: String(reg.id) },
    });

    reg.stripePaymentIntentId = intent.id;
    await this.registrationRepo.save(reg);

    return { clientSecret: intent.client_secret };
  }

  // Must receive the raw request body, not parsed JSON — constructEvent verifies
  // the Stripe signature against the exact bytes (see the controller).
  async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type !== 'payment_intent.succeeded') return;

    const intent = event.data.object as Stripe.PaymentIntent;
    const reg = await this.registrationRepo.findOne({
      where: { stripePaymentIntentId: intent.id },
    });
    if (!reg) return;

    await this.sendPaymentEmail(reg.id);
    await this.confirm(reg.id); // flips PENDING → CONFIRMED and sends the ticket
  }

  async getEventStats(eventId: number) {
    const stats = await this.registrationRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r.eventId = :eventId', { eventId })
      .groupBy('r.status')
      .getRawMany();

    return {
      eventId,
      byStatus: Object.fromEntries(stats.map((s) => [s.status, parseInt(s.count)])),
      total: stats.reduce((acc, s) => acc + parseInt(s.count), 0),
    };
  }

  // --- email-service calls ---
  // Every send reloads the registration with its user + event, bails if there's
  // no address to send to, and posts to the matching email-service endpoint.

  private async sendRegistrationEmail(registrationId: number): Promise<void> {
    const ctx = await this.recipientFor(registrationId);
    if (!ctx) return;
    await this.postEmail('registration', {
      to: ctx.user.email,
      name: this.recipientName(ctx.user),
      amountDue: Number(ctx.reg.amountPaid) || 0,
      currency: ctx.reg.event?.currency,
      event: this.eventInfo(ctx.reg.event),
    }, registrationId);
  }

  private async sendPaymentEmail(registrationId: number): Promise<void> {
    const ctx = await this.recipientFor(registrationId);
    if (!ctx) return;
    await this.postEmail('payment', {
      to: ctx.user.email,
      name: this.recipientName(ctx.user),
      amountPaid: Number(ctx.reg.amountPaid) || 0,
      currency: ctx.reg.event?.currency,
      pricingTier: ctx.reg.pricingTier,
      event: this.eventInfo(ctx.reg.event),
    }, registrationId);
  }

  private async sendConfirmationEmail(registrationId: number): Promise<void> {
    const ctx = await this.recipientFor(registrationId);
    if (!ctx) return;
    await this.postEmail('confirmation', {
      to: ctx.user.email,
      name: this.recipientName(ctx.user),
      status: ctx.reg.status,
      qrCodeUrl: ctx.reg.qrCodeUrl,
      event: this.eventInfo(ctx.reg.event),
    }, registrationId);
  }

  private async recipientFor(registrationId: number) {
    const reg = await this.findOne(registrationId);
    const user = reg.user;
    if (!user?.email) {
      this.logger.warn(`Registration ${registrationId} has no recipient email; skipping email`);
      return null;
    }
    return { reg, user };
  }

  private recipientName(user: { firstName?: string; lastName?: string; email: string }): string {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
  }

  private eventInfo(event?: Event) {
    return {
      name: event?.name,
      startDate: event?.startDate,
      endDate: event?.endDate,
      venue: event?.venue,
      city: event?.city,
      country: event?.country,
      description: event?.description,
    };
  }

  private async postEmail(path: string, body: unknown, registrationId: number): Promise<void> {
    const base = process.env.EMAIL_SERVICE_URL || 'http://localhost:3004';
    try {
      const res = await fetch(`${base}/api/v1/emails/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        this.logger.warn(`'${path}' email rejected (HTTP ${res.status}) for registration ${registrationId}`);
      }
    } catch (err: any) {
      this.logger.warn(`'${path}' email failed for registration ${registrationId}: ${err.message}`);
    }
  }
}
