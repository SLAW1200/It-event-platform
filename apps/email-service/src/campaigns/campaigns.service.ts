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
import { RegistrationConfirmationDto } from '../emails/dto/registration-confirmation.dto';

export type EmailProvider = 'brevo' | 'sendgrid' | 'ses' | 'smtp' | 'dev';

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

  // ─── Campaign CRUD ───────────────────────────────────────────────────────────

  async create(dto: CreateCampaignDto): Promise<EmailCampaign> {
    const campaign = this.campaignRepo.create(dto);
    return this.campaignRepo.save(campaign);
  }

  async findByEvent(eventId: number): Promise<EmailCampaign[]> {
    return this.campaignRepo.find({
      where: { eventId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<EmailCampaign> {
    const c = await this.campaignRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Campaign #${id} not found`);
    return c;
  }

  async update(id: number, dto: Partial<CreateCampaignDto>): Promise<EmailCampaign> {
    const c = await this.findOne(id);
    if (c.status === EmailCampaignStatus.SENT) {
      throw new BadRequestException('Cannot edit a sent campaign');
    }
    Object.assign(c, dto);
    return this.campaignRepo.save(c);
  }

  async schedule(id: number, scheduledTime: Date): Promise<EmailCampaign> {
    const c = await this.findOne(id);
    c.status = EmailCampaignStatus.SCHEDULED;
    c.scheduledTime = scheduledTime;
    return this.campaignRepo.save(c);
  }

  // ─── Sending ─────────────────────────────────────────────────────────────────

  async send(id: number, dto: SendCampaignDto): Promise<{ sent: number; failed: number }> {
    const campaign = await this.findOne(id);
    campaign.status = EmailCampaignStatus.SENDING;
    await this.campaignRepo.save(campaign);

    const results = { sent: 0, failed: 0 };

    for (const recipient of dto.recipients) {
      try {
        await this.sendEmail(
          {
            to: recipient.email,
            name: recipient.name,
            subject: campaign.subject,
            html: this.renderTemplate(campaign.htmlContent || campaign.content, recipient),
            from: this.fromAddress(),
          },
          dto.provider || this.defaultProvider(),
        );
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

  async sendTransactional(
    to: string,
    subject: string,
    html: string,
    name?: string,
  ): Promise<void> {
    await this.sendEmail(
      { to, name, subject, html, from: this.fromAddress() },
      this.defaultProvider(),
    );
  }

  /**
   * Sends the post-registration confirmation: branded event details + the
   * attendee's check-in QR code. Returns the provider used so callers/log can
   * surface the dev-preview path during a demo.
   */
  async sendRegistrationConfirmation(
    dto: RegistrationConfirmationDto,
  ): Promise<{ provider: EmailProvider; to: string }> {
    const provider = this.defaultProvider();
    await this.sendEmail(
      {
        to: dto.to,
        name: dto.name,
        subject: `You're registered for ${dto.event.name} 🎟️`,
        html: this.renderConfirmation(dto),
        from: this.fromAddress(),
      },
      provider,
    );
    this.logger.log(`Registration confirmation sent to ${dto.to} via ${provider}`);
    return { provider, to: dto.to };
  }

  // ─── Provider Router ─────────────────────────────────────────────────────────

  private fromAddress(): string {
    return process.env.AWS_SES_FROM_EMAIL || 'Eventra <noreply@eventra.dev>';
  }

  /**
   * Picks a transport from whatever is configured. With no real credentials
   * (the default local setup) it falls back to the `dev` transport, which
   * writes a viewable .html file and logs its path — so the "attendees get an
   * email" story is demoable offline.
   */
  private defaultProvider(): EmailProvider {
    if (process.env.BREVO_API_KEY) return 'brevo';
    if (process.env.SENDGRID_API_KEY) return 'sendgrid';
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    if (awsKey && awsKey !== 'local' && awsKey !== 'your-access-key') return 'ses';
    return 'dev';
  }

  private async sendEmail(
    mail: { to: string; name?: string; subject: string; html: string; from: string },
    provider: EmailProvider,
  ): Promise<void> {
    switch (provider) {
      case 'brevo':
        return this.sendViaBrevo(mail);
      case 'sendgrid':
        return this.sendViaSendGrid(mail);
      case 'dev':
        return this.sendViaDev(mail);
      case 'ses':
      default:
        return this.sendViaSES(mail);
    }
  }

  /**
   * Dev transport: no network. Writes the rendered email to disk and logs the
   * path so it can be opened in a browser during the demo.
   */
  private async sendViaDev(mail: { to: string; subject: string; html: string }) {
    const dir = process.env.MAIL_PREVIEW_DIR
      ? (isAbsolute(process.env.MAIL_PREVIEW_DIR)
          ? process.env.MAIL_PREVIEW_DIR
          : join(process.cwd(), process.env.MAIL_PREVIEW_DIR))
      : join(process.cwd(), '.maildev');
    await fs.mkdir(dir, { recursive: true });
    const safe = mail.to.replace(/[^a-z0-9]+/gi, '_');
    const file = join(dir, `${Date.now()}-${safe}.html`);
    await fs.writeFile(file, mail.html, 'utf8');
    this.logger.log(`📭 [dev email] "${mail.subject}" → ${mail.to}`);
    this.logger.log(`📭 [dev email] preview: ${file}`);
  }

  private async sendViaSES(mail: { to: string; subject: string; html: string; from: string }) {
    await this.ses.sendEmail({
      Source: mail.from,
      Destination: { ToAddresses: [mail.to] },
      Message: {
        Subject: { Data: mail.subject },
        Body: { Html: { Data: mail.html } },
      },
    }).promise();
  }

  private async sendViaBrevo(mail: { to: string; name?: string; subject: string; html: string; from: string }) {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    await apiInstance.sendTransacEmail({
      sender: { email: mail.from },
      to: [{ email: mail.to, name: mail.name }],
      subject: mail.subject,
      htmlContent: mail.html,
    });
  }

  private async sendViaSendGrid(mail: { to: string; subject: string; html: string; from: string }) {
    await sgMail.send({ to: mail.to, from: mail.from, subject: mail.subject, html: mail.html });
  }

  // ─── Template Rendering ──────────────────────────────────────────────────────

  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
  }

  private renderConfirmation(dto: RegistrationConfirmationDto): string {
    const e = dto.event
    const esc = (s = '') =>
      String(s).replace(/[&<>"]/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string),
      )

    const fmt = (iso?: string) => {
      if (!iso) return ''
      const d = new Date(iso)
      return Number.isNaN(d.getTime())
        ? ''
        : d.toLocaleDateString('en-US', {
            weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
          })
    }
    const start = fmt(e.startDate)
    const end = fmt(e.endDate)
    const when = start && end && start !== end ? `${start} – ${end}` : start || end
    const where = [e.venue, e.city, e.country].filter(Boolean).map(esc).join(', ')

    const row = (label: string, value: string) =>
      value
        ? `<tr>
             <td style="padding:6px 0;color:#71717a;font-size:13px;width:90px;">${label}</td>
             <td style="padding:6px 0;color:#18181b;font-size:14px;font-weight:600;">${value}</td>
           </tr>`
        : ''

    const qrBlock = dto.qrCodeUrl
      ? `<div style="text-align:center;margin:28px 0 8px;">
           <div style="display:inline-block;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:16px;">
             <img src="${dto.qrCodeUrl}" alt="Your check-in QR code" width="180" height="180" style="display:block;" />
           </div>
           <p style="margin:14px 0 0;color:#71717a;font-size:13px;">
             Show this QR code at the door for instant check-in.
           </p>
         </div>`
      : ''

    return `<!doctype html>
<html>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e4e4e7;">
      <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:32px 28px;color:#fff;">
        <p style="margin:0;font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.85;">Eventra</p>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;">You're registered! 🎟️</h1>
        <p style="margin:8px 0 0;font-size:15px;opacity:.9;">Hi ${esc(dto.name)}, your spot is confirmed.</p>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 4px;font-size:19px;color:#18181b;">${esc(e.name)}</h2>
        ${e.description ? `<p style="margin:0 0 18px;color:#52525b;font-size:14px;line-height:1.6;">${esc(e.description)}</p>` : ''}
        <table style="width:100%;border-collapse:collapse;">
          ${row('When', esc(when))}
          ${row('Where', where)}
          ${row('Status', esc(dto.status))}
        </table>
        ${qrBlock}
      </div>
      <div style="padding:18px 28px;border-top:1px solid #f4f4f5;color:#a1a1aa;font-size:12px;text-align:center;">
        Sent by Eventra · keep this email for check-in
      </div>
    </div>
  </div>
</body>
</html>`
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  async trackOpen(campaignId: number): Promise<void> {
    await this.campaignRepo.increment({ id: campaignId }, 'totalOpened', 1);
  }

  async trackClick(campaignId: number): Promise<void> {
    await this.campaignRepo.increment({ id: campaignId }, 'totalClicked', 1);
  }

  async getAnalytics(id: number) {
    const c = await this.findOne(id);
    return {
      campaignId: id,
      name: c.name,
      totalSent: c.totalSent,
      totalOpened: c.totalOpened,
      totalClicked: c.totalClicked,
      totalBounced: c.totalBounced,
      openRate: c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(1) : '0',
      clickRate: c.totalSent > 0 ? ((c.totalClicked / c.totalSent) * 100).toFixed(1) : '0',
    };
  }
}
