import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn, Registration } from '@event-platform/database';
import { RegistrationStatus } from '@event-platform/shared';
import { CheckInGateway } from './checkin.gateway';

@Injectable()
export class CheckInService {
  private readonly logger = new Logger(CheckInService.name);

  constructor(
    @InjectRepository(CheckIn)
    private readonly checkInRepo: Repository<CheckIn>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    private readonly gateway: CheckInGateway,
  ) {}

  async processQrCheckIn(
    qrPayload: string,
    staffId: number,
    sessionId?: number,
  ): Promise<CheckIn> {
    let parsed: { eventId: number; userId: number };
    try {
      parsed = JSON.parse(qrPayload);
    } catch {
      throw new BadRequestException('Invalid QR code payload');
    }

    const registration = await this.registrationRepo.findOne({
      where: { eventId: parsed.eventId, userId: parsed.userId },
      relations: { user: true, event: true },
    });

    if (!registration) throw new NotFoundException('Registration not found');
    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Registration is cancelled');
    }
    if (registration.status === RegistrationStatus.CHECKED_IN && !sessionId) {
      throw new BadRequestException('Participant already checked in');
    }

    // Create check-in record
    const checkIn = this.checkInRepo.create({
      registrationId: registration.id,
      staffId,
      sessionId,
      checkInMethod: 'qr_code',
    });
    const saved = await this.checkInRepo.save(checkIn);

    // Update registration status
    registration.status = RegistrationStatus.CHECKED_IN;
    await this.registrationRepo.save(registration);

    // Emit real-time update via WebSocket
    this.gateway.emitCheckIn(registration.eventId, {
      checkInId: saved.id,
      registrationId: registration.id,
      userId: registration.userId,
      userName: `${registration.user?.firstName} ${registration.user?.lastName}`,
      sessionId,
      checkInTime: saved.checkInTime,
    });

    this.logger.log(
      `Check-in ${saved.id}: User ${registration.userId} at event ${registration.eventId}`,
    );
    return saved;
  }

  async manualCheckIn(registrationId: number, staffId: number): Promise<CheckIn> {
    const registration = await this.registrationRepo.findOne({
      where: { id: registrationId },
      relations: { user: true, event: true },
    });
    if (!registration) throw new NotFoundException('Registration not found');

    const checkIn = this.checkInRepo.create({
      registrationId,
      staffId,
      checkInMethod: 'manual',
    });
    const saved = await this.checkInRepo.save(checkIn);
    registration.status = RegistrationStatus.CHECKED_IN;
    await this.registrationRepo.save(registration);

    this.gateway.emitCheckIn(registration.eventId, { checkInId: saved.id, registrationId });
    return saved;
  }

  async getEventAttendance(eventId: number) {
    const total = await this.registrationRepo.count({ where: { eventId } });
    const checkedIn = await this.registrationRepo.count({
      where: { eventId, status: RegistrationStatus.CHECKED_IN },
    });
    const recentCheckIns = await this.checkInRepo
      .createQueryBuilder('ci')
      .innerJoinAndSelect('ci.registration', 'r')
      .innerJoinAndSelect('r.user', 'u')
      .where('r.eventId = :eventId', { eventId })
      .orderBy('ci.checkInTime', 'DESC')
      .take(20)
      .getMany();

    return {
      eventId,
      totalRegistrations: total,
      checkedIn,
      notCheckedIn: total - checkedIn,
      attendanceRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
      recentCheckIns,
    };
  }

  async getCheckInsBySession(eventId: number, sessionId: number) {
    return this.checkInRepo
      .createQueryBuilder('ci')
      .innerJoinAndSelect('ci.registration', 'r')
      .innerJoinAndSelect('r.user', 'u')
      .where('r.eventId = :eventId AND ci.sessionId = :sessionId', { eventId, sessionId })
      .orderBy('ci.checkInTime', 'ASC')
      .getMany();
  }
}
