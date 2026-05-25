// eventId is nullable: some tickets are platform-level (account help) rather
// than tied to a specific event.
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { TicketStatus, TicketPriority } from '@event-platform/shared';
import { User } from './user.entity';
import { Event } from './event.entity';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  eventId: number;

  @ManyToOne(() => Event, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  assignedToId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ nullable: true })
  channel: string; // email, chat, phone

  // Conversation thread. `isInternal: true` messages are agent-only notes
  // and must be filtered out before showing the ticket to the customer.
  @Column({ type: 'jsonb', default: [] })
  messages: Array<{
    senderId: number;
    content: string;
    isInternal: boolean;
    createdAt: Date;
  }>;

  // Timestamps powering SLA dashboards. `firstResponseAt` is set on the first
  // outbound agent message; `slaDueAt` is computed from priority on create.
  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  firstResponseAt: Date;

  @Column({ nullable: true })
  slaDueAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
