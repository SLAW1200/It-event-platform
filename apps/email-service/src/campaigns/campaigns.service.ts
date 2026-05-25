// Campaign + transactional email sending. We support a few providers and pick
// one at send time based on what's configured (Brevo > SendGrid > SES), falling
// back to a "dev" transport that just writes the HTML to disk for local work.
import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { join, isAbsolute } from 'path';
import * as SibApiV3Sdk from '@sendinblue/client';
import sgMail from '@sendgrid/mail';
import { SES } from 'aws-sdk';
import { EmailCampaign } from '@event-platform/database';
import { EmailCampaignStatus } from '@event-platform/shared';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { SendCampaignDto } from './dto/send-campaign.dto';
import {
  RegistrationEmailDto,
  PaymentEmailDto,
  ConfirmationEmailDto,
  ConfirmationEventInfo,
} from '../emails/dto/registration-confirmation.dto';

export type EmailProvider = 'brevo' | 'sendgrid' | 'ses' | 'smtp' | 'dev';

type Mail = { to: string; name?: string; subject: string; html: string; from: string };

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);
  private readonly ses: SES;

  constructor(
    @InjectRepository(EmailCampaign)
    private readonly campaignRepo: Repository<EmailCampaign>,
  ) {
    this.ses = new SES({ region: process.env.AWS_REGION || 'us-east-1' });
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  create(dto: CreateCampaignDto): Promise<EmailCampaign> {
    return this.campaignRepo.save(this.campaignRepo.create(dto));
  }

  findByEvent(eventId: number): Promise<EmailCampaign[]> {
    return this.campaignRepo.find({ where: { eventId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<EmailCampaign> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campaign #${id} not found`);
    return campaign;
  }

  async update(id: number, dto: Partial<CreateCampaignDto>): Promise<EmailCampaign> {
    const campaign = await this.findOne(id);
    if (campaign.status === EmailCampaignStatus.SENT) {
      throw new BadRequestException('Cannot edit a sent campaign');
    }
    Object.assign(campaign, dto);
    return this.campaignRepo.save(campaign);
  }

  async schedule(id: number, scheduledTime: Date): Promise<EmailCampaign> {
    const campaign = await this.findOne(id);
    campaign.status = EmailCampaignStatus.SCHEDULED;
    campaign.scheduledTime = scheduledTime;
    return this.campaignRepo.save(campaign);
  }

  async send(id: number, dto: SendCampaignDto): Promise<{ sent: number; failed: number }> {
    const campaign = await this.findOne(id);
    campaign.status = EmailCampaignStatus.SENDING;
    await this.campaignRepo.save(campaign);

    const provider = dto.provider || this.defaultProvider();
    const results = { sent: 0, failed: 0 };

    // One recipient at a time so a single bad address doesn't sink the batch.
    for (const recipient of dto.recipients) {
      try {
        await this.sendEmail({
          to: recipient.email,
          name: recipient.name,
          subject: campaign.subject,
          html: this.renderTemplate(campaign.htmlContent || campaign.content, recipient),
          from: this.fromAddress(),
        }, provider);
        results.sent++;
      } catch (err) {
        this.logger.error(`Failed to send to ${recipient.email}: ${err.message}`);
        results.failed++;
      }
    }

    campaign.status = EmailCampaignStatus.SENT;
    campaign.sentAt = new Date();
    campaign.totalSent = results.sent;
    await this.campaignRepo.save(campaign);

    this.logger.log(`Campaign ${id} sent: ${results.sent} ok, ${results.failed} failed`);
    return results;
  }

  sendTransactional(to: string, subject: string, html: string, name?: string): Promise<void> {
    return this.sendEmail({ to, name, subject, html, from: this.fromAddress() }, this.defaultProvider());
  }

  // The three calls below map to the registration lifecycle. They return the
  // provider so callers can log/surface the dev preview path during a demo.
  sendRegistrationReceived(dto: RegistrationEmailDto) {
    return this.deliver(dto.to, dto.name,
      `We received your registration for ${dto.event.name} 📝`,
      this.renderRegistration(dto));
  }

  sendPaymentReceipt(dto: PaymentEmailDto) {
    return this.deliver(dto.to, dto.name,
      `Payment received for ${dto.event.name} 💳`,
      this.renderPayment(dto));
  }

  sendConfirmation(dto: ConfirmationEmailDto) {
    return this.deliver(dto.to, dto.name,
      `You're confirmed for ${dto.event.name} 🎟️`,
      this.renderConfirmation(dto));
  }

  private async deliver(to: string, name: string, subject: string, html: string) {
    const provider = this.defaultProvider();
    await this.sendEmail({ to, name, subject, html, from: this.fromAddress() }, provider);
    this.logger.log(`Sent "${subject}" to ${to} via ${provider}`);
    return { provider, to };
  }

  // --- provider routing ---

  private fromAddress(): string {
    return process.env.AWS_SES_FROM_EMAIL || 'Eventra <noreply@eventra.dev>';
  }

  private defaultProvider(): EmailProvider {
    if (process.env.BREVO_API_KEY) return 'brevo';
    if (process.env.SENDGRID_API_KEY) return 'sendgrid';
    // The placeholder values are what the local .env ships with.
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    if (awsKey && awsKey !== 'local' && awsKey !== 'your-access-key') return 'ses';
    return 'dev';
  }

  private sendEmail(mail: Mail, provider: EmailProvider): Promise<void> {
    switch (provider) {
      case 'brevo': return this.sendViaBrevo(mail);
      case 'sendgrid': return this.sendViaSendGrid(mail);
      case 'dev': return this.sendViaDev(mail);
      case 'ses':
      default: return this.sendViaSES(mail);
    }
  }

  // No network — write the email to disk and log the path so it can be opened
  // in a browser during local development.
  private async sendViaDev(mail: Mail): Promise<void> {
    const configured = process.env.MAIL_PREVIEW_DIR;
    const dir = configured
      ? (isAbsolute(configured) ? configured : join(process.cwd(), configured))
      : join(process.cwd(), '.maildev');
    await fs.mkdir(dir, { recursive: true });

    const safeName = mail.to.replace(/[^a-z0-9]+/gi, '_');
    const file = join(dir, `${Date.now()}-${safeName}.html`);
    await fs.writeFile(file, mail.html, 'utf8');

    this.logger.log(`📭 [dev email] "${mail.subject}" → ${mail.to}`);
    this.logger.log(`📭 [dev email] preview: ${file}`);
  }

  private async sendViaSES(mail: Mail): Promise<void> {
    await this.ses.sendEmail({
      Source: mail.from,
      Destination: { ToAddresses: [mail.to] },
      Message: {
        Subject: { Data: mail.subject },
        Body: { Html: { Data: mail.html } },
      },
    }).promise();
  }

  private async sendViaBrevo(mail: Mail): Promise<void> {
    const api = new SibApiV3Sdk.TransactionalEmailsApi();
    api.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    await api.sendTransacEmail({
      sender: { email: mail.from },
      to: [{ email: mail.to, name: mail.name }],
      subject: mail.subject,
      htmlContent: mail.html,
    });
  }

  private async sendViaSendGrid(mail: Mail): Promise<void> {
    await sgMail.send({ to: mail.to, from: mail.from, subject: mail.subject, html: mail.html });
  }

  // --- HTML rendering ---

  // Campaign bodies are pre-rendered HTML; we just swap {{field}} merge tags.
  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
  }

  // Everything attendee-supplied goes through esc() before it lands in the markup.
  private esc(value = ''): string {
    return String(value).replace(/[&<>"]/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string),
    );
  }

  private formatDate(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
    });
  }

  private money(amount: number, currency = 'usd'): string {
    return `${currency.toUpperCase()} ${Number(amount).toFixed(2)}`;
  }

  // Label/value row; skipped entirely when there's no value to show.
  private row(label: string, value: string): string {
    if (!value) return '';
    return `<tr>
           <td style="padding:6px 0;color:#71717a;font-size:13px;width:90px;">${label}</td>
           <td style="padding:6px 0;color:#18181b;font-size:14px;font-weight:600;">${value}</td>
         </tr>`;
  }

  private eventRows(event: ConfirmationEventInfo): string {
    const start = this.formatDate(event.startDate);
    const end = this.formatDate(event.endDate);
    const when = start && end && start !== end ? `${start} – ${end}` : start || end;
    const where = [event.venue, event.city, event.country].filter(Boolean).map((s) => this.esc(s)).join(', ');
    return this.row('When', this.esc(when)) + this.row('Where', where);
  }

  // Inline styles only — most mail clients strip <style> blocks from <head>.
  private layout(opts: { title: string; subtitle: string; body: string }): string {
    return `<!doctype html>
<html>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e4e4e7;">
      <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:32px 28px;color:#fff;">
        <p style="margin:0;font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.85;">Eventra</p>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;">${opts.title}</h1>
        <p style="margin:8px 0 0;font-size:15px;opacity:.9;">${opts.subtitle}</p>
      </div>
      <div style="padding:28px;">${opts.body}</div>
      <div style="padding:18px 28px;border-top:1px solid #f4f4f5;color:#a1a1aa;font-size:12px;text-align:center;">
        Sent by Eventra
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  private renderRegistration(dto: RegistrationEmailDto): string {
    const e = dto.event;
    const due = dto.amountDue && dto.amountDue > 0
      ? `<div style="margin-top:18px;background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;color:#854d0e;font-size:14px;">
           <strong>Payment required:</strong> ${this.money(dto.amountDue, dto.currency)} — your spot is held until payment is complete.
         </div>`
      : '';
    return this.layout({
      title: 'Registration received 📝',
      subtitle: `Hi ${this.esc(dto.name)}, we've got your details.`,
      body: `
        <h2 style="margin:0 0 4px;font-size:19px;color:#18181b;">${this.esc(e.name)}</h2>
        ${e.description ? `<p style="margin:0 0 18px;color:#52525b;font-size:14px;line-height:1.6;">${this.esc(e.description)}</p>` : ''}
        <table style="width:100%;border-collapse:collapse;">${this.eventRows(e)}</table>
        ${due}
        <p style="margin:18px 0 0;color:#71717a;font-size:13px;">We'll email your check-in QR code as soon as your spot is confirmed.</p>`,
    });
  }

  private renderPayment(dto: PaymentEmailDto): string {
    const e = dto.event;
    return this.layout({
      title: 'Payment received 💳',
      subtitle: `Hi ${this.esc(dto.name)}, thanks — your payment is confirmed.`,
      body: `
        <h2 style="margin:0 0 4px;font-size:19px;color:#18181b;">${this.esc(e.name)}</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${this.eventRows(e)}
          ${this.row('Amount', this.money(dto.amountPaid, dto.currency))}
          ${this.row('Tier', this.esc(dto.pricingTier || ''))}
        </table>
        <p style="margin:18px 0 0;color:#71717a;font-size:13px;">Keep this email as your receipt. Your check-in QR follows in a separate confirmation email.</p>`,
    });
  }

  private renderConfirmation(dto: ConfirmationEmailDto): string {
    const e = dto.event;
    const qrBlock = dto.qrCodeUrl
      ? `<div style="text-align:center;margin:28px 0 8px;">
           <div style="display:inline-block;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:16px;">
             <img src="${dto.qrCodeUrl}" alt="Your check-in QR code" width="180" height="180" style="display:block;" />
           </div>
           <p style="margin:14px 0 0;color:#71717a;font-size:13px;">
             Show this QR code at the door for instant check-in.
           </p>
         </div>`
      : '';
    return this.layout({
      title: "You're confirmed! 🎟️",
      subtitle: `Hi ${this.esc(dto.name)}, your spot is confirmed.`,
      body: `
        <h2 style="margin:0 0 4px;font-size:19px;color:#18181b;">${this.esc(e.name)}</h2>
        ${e.description ? `<p style="margin:0 0 18px;color:#52525b;font-size:14px;line-height:1.6;">${this.esc(e.description)}</p>` : ''}
        <table style="width:100%;border-collapse:collapse;">
          ${this.eventRows(e)}
          ${this.row('Status', this.esc(dto.status))}
        </table>
        ${qrBlock}`,
    });
  }

  // --- open/click tracking ---

  // Atomic increment so concurrent pixel/link hits don't clobber each other.
  async trackOpen(campaignId: number): Promise<void> {
    await this.campaignRepo.increment({ id: campaignId }, 'totalOpened', 1);
  }

  async trackClick(campaignId: number): Promise<void> {
    await this.campaignRepo.increment({ id: campaignId }, 'totalClicked', 1);
  }

  async getAnalytics(id: number) {
    const c = await this.findOne(id);
    const rate = (n: number) => (c.totalSent > 0 ? ((n / c.totalSent) * 100).toFixed(1) : '0');
    return {
      campaignId: id,
      name: c.name,
      totalSent: c.totalSent,
      totalOpened: c.totalOpened,
      totalClicked: c.totalClicked,
      totalBounced: c.totalBounced,
      openRate: rate(c.totalOpened),
      clickRate: rate(c.totalClicked),
    };
  }
}
