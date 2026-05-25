// Other services reference users by id rather than joining across boundaries.
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { UserRole } from '@event-platform/shared';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  // `select: false` excludes the hash from default SELECTs so it never leaks
  // into API responses — callers must opt in via addSelect() during auth.
  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PARTICIPANT })
  role: UserRole;

  // Catch-all for arbitrary profile metadata (custom fields, preferences).
  // jsonb lets us index/query individual keys in Postgres if needed later.
  @Column({ type: 'jsonb', default: {} })
  profileData: Record<string, any>;

  @Column({ default: true })
  active: boolean;

  // Populated when the user is provisioned via AWS Cognito (SSO path).
  // Local-auth users leave this null.
  @Column({ nullable: true })
  cognitoId: string;

  @Column({ nullable: true })
  linkedinUrl: string;

  @Column({ nullable: true })
  bio: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
