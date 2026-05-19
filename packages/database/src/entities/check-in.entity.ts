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

  @Column()
  staffId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'staffId' })
  staff: User;

  @Column({ nullable: true })
  sessionId: number;

  @Column({ nullable: true })
  sessionName: string;

  @Column({ default: 'qr_code' })
  checkInMethod: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  checkInTime: Date;
}
