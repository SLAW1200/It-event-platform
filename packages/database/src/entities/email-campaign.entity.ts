// One row per bulk email job. Scheduled rows are picked up once their
// scheduledTime passes and flipped to SENDING.
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { EmailCampaignStatus } from '@event-platform/shared';
import { Event } from './event.entity';

@Entity('email_campaigns')
export class EmailCampaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  name: string;

  @Column()
  subject: string;

  // Plaintext fallback (kept in sync with htmlContent).
  @Column({ type: 'text' })
  content: string;

  // Rendered HTML body. May contain {{merge}} tokens that the sender
  // substitutes per-recipient.
  @Column({ nullable: true, type: 'text' })
  htmlContent: string;

  @Column({ type: 'enum', enum: EmailCampaignStatus, default: EmailCampaignStatus.DRAFT })
  status: EmailCampaignStatus;

  @Column({ nullable: true })
  scheduledTime: Date;

  @Column({ nullable: true })
  sentAt: Date;

  // Audience filter expressed as a rule tree (e.g. status=CONFIRMED AND
  // registeredAt > X). Evaluated when the campaign starts sending.
  @Column({ type: 'jsonb', nullable: true })
  segmentRules: Record<string, any>;

  // Engagement counters — incremented by webhooks from the email provider
  // (open pixel, link rewrites, bounce/delivery callbacks).
  @Column({ default: 0 })
  totalSent: number;

  @Column({ default: 0 })
  totalOpened: number;

  @Column({ default: 0 })
  totalClicked: number;

  @Column({ default: 0 })
  totalBounced: number;

  // 'ses', 'sendgrid', 'smtp' — recorded so analytics can compare deliverability
  // across providers.
  @Column({ nullable: true })
  emailProvider: string;

  @CreateDateColumn()
  createdAt: Date;
}
