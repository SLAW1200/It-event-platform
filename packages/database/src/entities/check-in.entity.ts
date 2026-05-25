// One row per scan at the door (or per session, for multi-session events).
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Registration } from './registration.entity';
import { User } from './user.entity';

@Entity('check_ins')
export class CheckIn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  registrationId: number;

  @ManyToOne(() => Registration)
  @JoinColumn({ name: 'registrationId' })
  registration: Registration;

  // Staff member who performed the scan (audit trail).
  @Column()
  staffId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'staffId' })
  staff: User;

  // For multi-session events: which session this scan was for.
  // null = main event entry (single-session model).
  @Column({ nullable: true })
  sessionId: number;

  @Column({ nullable: true })
  sessionName: string;

  // 'qr_code' (default), 'manual', 'nfc' — used by analytics to track which
  // scan method was used at the door.
  @Column({ default: 'qr_code' })
  checkInMethod: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  checkInTime: Date;
}
