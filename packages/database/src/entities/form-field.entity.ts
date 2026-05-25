// One row per question on an event's registration form, rendered in
// orderIndex order according to fieldType.
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

  // Only meaningful for SELECT/MULTISELECT/RADIO. Ignored otherwise.
  @Column({ type: 'jsonb', nullable: true })
  options: string[];

  // e.g. { minLength: 3, pattern: '^.+@.+$' }. Mirrored on the client; the
  // server re-checks on submit so a tampered client can't bypass it.
  @Column({ type: 'jsonb', default: {} })
  validationRules: Record<string, any>;

  // "Show this field when field X has value Y" rules — evaluated client-side
  // to hide/show inputs as the user fills the form.
  @Column({ type: 'jsonb', default: {} })
  conditionalLogic: Record<string, any>;

  @Column({ default: false })
  required: boolean;

  // Render order. Authoring UI lets users drag-reorder; persisted as ints
  // (10, 20, 30…) so insertions don't force a re-numbering of every row.
  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @Column({ default: true })
  active: boolean;
}
