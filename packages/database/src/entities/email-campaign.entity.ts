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

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true, type: 'text' })
  htmlContent: string;

  @Column({ type: 'enum', enum: EmailCampaignStatus, default: EmailCampaignStatus.DRAFT })
  status: EmailCampaignStatus;

  @Column({ nullable: true })
  scheduledTime: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  segmentRules: Record<string, any>;

  @Column({ default: 0 })
  totalSent: number;

  @Column({ default: 0 })
  totalOpened: number;

  @Column({ default: 0 })
  totalClicked: number;

  @Column({ default: 0 })
  totalBounced: number;

  @Column({ nullable: true })
  emailProvider: string;

  @CreateDateColumn()
  createdAt: Date;
}
