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

    // Public self-registration is only allowed on live events.
    if (opts.enforcePublished) {
      const open = [EventStatus.PUBLISHED, EventStatus.ONGOING];
      if (!open.includes(event.status)) {
        throw new BadRequestException('This event is not open for registration yet');
      }
    }

    // Check for duplicate
    const existing = await this.registrationRepo.findOne({
      where: { eventId: dto.eventId, userId: dto.userId },
    });
    if (existing) throw new BadRequestException('Already registered for this event');

    // Evaluate rules
    const formFields = await this.formFieldRepo.find({ where: { eventId: dto.eventId } });
    const rules = formFields.flatMap((f) => f.conditionalLogic?.rules || []);

    const evalResult = this.rulesEngine.evaluateForm(rules, {
      user: dto.userData || {},
      event: dto.eventData || {},
      formData: dto.formData || {},
    }, dto.basePrice || 0);

    if (!evalResult.isValid) {
      throw new BadRequestException({ message: 'Form validation failed', errors: evalResult.errors });
    }

    // Generate QR code
    const qrPayload = JSON.stringify({ eventId: dto.eventId, userId: dto.userId, timestamp: Date.now() });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

    const registration = this.registrationRepo.create({
      eventId: dto.eventId,
      userId: dto.userId,
      formData: evalResult.updatedFormData,
      amountPaid: evalResult.finalPrice,
      pricingTier: evalResult.pricingTier,
      qrCode: qrPayload,
      qrCodeUrl: qrCodeDataUrl,
      status: evalResult.finalPrice > 0
        ? RegistrationStatus.PENDING
        : RegistrationStatus.CONFIRMED,
    });

    const saved = await this.registrationRepo.save(registration);
    this.logger.log(`Registration ${saved.id} created for user ${dto.userId} at event ${dto.eventId}`);

    // Confirmation email (details + QR). Best-effort: a mail hiccup must never
    // fail the registration — the attendee still has their QR in the UI.
    await this.sendConfirmation(saved.id);

    return saved;
  }

  /**
   * Fires the post-registration confirmation email via email-service. Reloads
   * the registration with its user + event so the email has real details.
   */
  private async sendConfirmation(registrationId: number): Promise<void> {
    try {
      const reg = await this.findOne(registrationId);
      const user = reg.user;
      const event = reg.event;
      if (!user?.email) {
        this.logger.warn(`No email on user for registration ${registrationId}; skipping confirmation`);
        return;
      }

      const base = process.env.EMAIL_SERVICE_URL || 'http://localhost:3004';
      const res = await fetch(`${base}/api/v1/emails/registration-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
          status: reg.status,
          qrCodeUrl: reg.qrCodeUrl,
          event: {
            name: event?.name,
            startDate: event?.startDate,
            endDate: event?.endDate,
            venue: event?.venue,
            city: event?.city,
            country: event?.country,
            description: event?.description,
          },
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Confirmation email rejected (HTTP ${res.status}) for registration ${registrationId}`);
      }
    } catch (err: any) {
      this.logger.warn(`Confirmation email failed for registration ${registrationId}: ${err.message}`);
    }
  }

  async findByEvent(eventId: number): Promise<Registration[]> {
    return this.registrationRepo.find({
      where: { eventId },
      relations: { user: true },
      order: { registrationDate: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Registration[]> {
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
    return this.registrationRepo.save(reg);
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

  async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload, signature, process.env.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const reg = await this.registrationRepo.findOne({
        where: { stripePaymentIntentId: intent.id },
      });
      if (reg) await this.confirm(reg.id);
    }
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
}
