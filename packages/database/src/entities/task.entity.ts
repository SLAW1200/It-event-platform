// Organiser-side todo items scoped to an event, shown as a kanban board.
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { TaskStatus, TaskPriority } from '@event-platform/shared';
import { Event } from './event.entity';
import { User } from './user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  assignedToId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  estimatedHours: number;

  @Column({ nullable: true })
  actualHours: number;

  // S3 URLs of files uploaded via the file-service.
  @Column({ type: 'jsonb', default: [] })
  attachments: string[];

  // Inline comment thread on the task. Stored denormalised here rather than
  // in a separate table because comment volume is low and reads are always
  // alongside the parent task.
  @Column({ type: 'jsonb', default: [] })
  comments: Array<{ userId: number; text: string; createdAt: Date }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
