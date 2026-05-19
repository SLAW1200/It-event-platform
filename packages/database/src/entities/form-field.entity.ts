import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { FormFieldType } from '@event-platform/shared';
import { Event } from './event.entity';

@Entity('form_fields')
export class FormField {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  fieldName: string;

  @Column()
  label: string;

  @Column({ nullable: true })
  placeholder: string;

  @Column({ nullable: true, type: 'text' })
  helpText: string;

  @Column({ type: 'enum', enum: FormFieldType })
  fieldType: FormFieldType;

  @Column({ type: 'jsonb', nullable: true })
  options: string[];

  @Column({ type: 'jsonb', default: {} })
  validationRules: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  conditionalLogic: Record<string, any>;

  @Column({ default: false })
  required: boolean;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @Column({ default: true })
  active: boolean;
}
