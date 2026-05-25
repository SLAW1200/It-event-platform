import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { EventStatus } from '@event-platform/shared';
import { User } from './user.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ nullable: true })
  venue: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  websiteUrl: string;

  @Column({ nullable: true })
  customDomain: string;

  // Key into the canned landing-page templates (see frontend lib/templates.ts).
  @Column({ nullable: true })
  templateId: string;

  // null = unlimited. The rules engine compares confirmed registrations
  // against this value when deciding whether to waitlist.
  @Column({ type: 'int', nullable: true })
  maxParticipants: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePrice: number;

  @Column({ nullable: true })
  currency: string;

  // Until this date, `earlyBirdPrice` overrides `basePrice` at checkout.
  @Column({ nullable: true })
  earlyBirdDeadline: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  earlyBirdPrice: number;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  // Theme, hero copy overrides, custom CSS — read by the public page renderer.
  @Column({ type: 'jsonb', default: {} })
  configuration: Record<string, any>;

  // OpenGraph / Twitter card overrides for the public event page.
  @Column({ type: 'jsonb', default: {} })
  seoMeta: Record<string, any>;

  @Column()
  organizerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizerId' })
  organizer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
