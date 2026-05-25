// Notifications fan-out. Currently only Slack is wired up; `email` and
// `push` are accepted in the DTO but treated as log-only no-ops so callers
// can be future-proofed without us having to add stubs everywhere.
import { Injectable, Logger } from '@nestjs/common';
import { WebClient } from '@slack/web-api';

export interface SendNotificationDto {
  type: 'slack' | 'email' | 'push';
  channel?: string;
  message: string;
  title?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly slack: WebClient | null = null;
  private readonly log: SendNotificationDto[] = [];

  constructor() {
    if (process.env.SLACK_BOT_TOKEN) {
      this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    }
  }

  async send(dto: SendNotificationDto): Promise<{ success: boolean }> {
    this.log.push({ ...dto });
    this.logger.log(`Notification [${dto.type}]: ${dto.title || dto.message}`);

    if (dto.type === 'slack' && this.slack) {
      try {
        await this.slack.chat.postMessage({
          channel: dto.channel || process.env.SLACK_SUPPORT_CHANNEL || '#general',
          text: dto.title ? `*${dto.title}*\n${dto.message}` : dto.message,
        });
      } catch (e) {
        this.logger.warn(`Slack notification failed: ${e.message}`);
        return { success: false };
      }
    }

    return { success: true };
  }

  async sendBulk(notifications: SendNotificationDto[]): Promise<{ sent: number }> {
    await Promise.allSettled(notifications.map((n) => this.send(n)));
    return { sent: notifications.length };
  }

  // Last 50 notifications, newest at the end. In-memory only — restart
  // wipes it. Good enough for the admin dashboard's recent-activity tile.
  getLog() {
    return this.log.slice(-50);
  }
}
