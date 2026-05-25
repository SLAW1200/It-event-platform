import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, OneToOne,
} from 'typeorm';
import { RegistrationStatus } from '@event-platform/shared';
import { User } from './user.entity';
import { Event } from './event.entity';

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Answers to the per-event form, keyed by FormField. Dynamic schema —
  // validate against this event's FormField rows before trusting it.
  @Column({ type: 'jsonb', default: {} })
  formData: Record<string, any>;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.PENDING,
  })
  status: RegistrationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  // Set once a Stripe PaymentIntent is created; used to reconcile webhook
  // callbacks back to the registration.
  @Column({ nullable: true })
  stripePaymentIntentId: string;

  // QR-code payload (opaque token) and the public URL to its rendered PNG.
  // Scanned at the door by the check-in service.
  @Column({ nullable: true })
  qrCode: string;

  @Column({ nullable: true })
  qrCodeUrl: string;

  @Column({ nullable: true })
  pricingTier: string;

  @CreateDateColumn()
  registrationDate: Date;

  @Column({ nullable: true })
  confirmedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;
}
