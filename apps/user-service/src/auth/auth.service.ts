import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { GuestDto } from './dto/guest.dto';
import { UserRole } from '@event-platform/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    this.logger.log(`New registration: ${user.email}`);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !user.active || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    delete (user as Partial<typeof user>).passwordHash;
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }

  /**
   * Used by public attendee self-registration: returns the existing user for
   * this email, or creates a passwordless PARTICIPANT. No tokens are issued —
   * the caller only needs the user id to attach a registration.
   */
  async findOrCreateGuest(dto: GuestDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) return { user: existing };

    const user = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      // Random, unguessable placeholder — guest accounts can be claimed later
      // by registering with the same email through the normal flow.
      password: randomBytes(24).toString('base64url'),
      role: UserRole.PARTICIPANT,
    });
    this.logger.log(`Guest registered: ${user.email}`);
    return { user };
  }

  async refreshToken(userId: number) {
    const user = await this.usersService.findOne(userId);
    return this.generateTokens(user.id, user.email, user.role);
  }

  private async generateTokens(userId: number, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    // Access-token lifetime is driven by JWT_EXPIRES_IN (7d in dev). The
    // frontend stores it as the session cookie and has no refresh flow, so a
    // short-lived access token would silently log organizers out mid-session.
    const accessExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: accessExpiresIn }),
      this.jwtService.signAsync(payload, { expiresIn: '30d' }),
    ]);
    return { accessToken, refreshToken };
  }
}
