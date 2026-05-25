// Directory, profile editing, match suggestions, and lightweight meeting
// scheduling. Profiles live in User.profileData (jsonb) — there's no separate
// table yet — so updates merge into that blob rather than replacing it.
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { User } from '@event-platform/database';

export class UpdateProfileDto {
  bio?: string;
  linkedinUrl?: string;
  interests?: string[];
  lookingFor?: string[];
  availableForMeetings?: boolean;
}

export class ScheduleMeetingDto {
  requesterId: number;
  recipientId: number;
  eventId: number;
  proposedTime: string;
  durationMinutes?: number;
  notes?: string;
}

// In-memory meeting store — single-process only. Restarting the service
// wipes scheduled meetings. Promote to a real entity (Meeting/{id,
// requesterId, recipientId, eventId, ...}) before going to production.
const meetingStore: any[] = [];

@Injectable()
export class NetworkingService {
  private readonly logger = new Logger(NetworkingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async searchParticipants(
    eventId: number,
    query?: string,
    interests?: string[],
  ): Promise<User[]> {
    const qb = this.userRepo.createQueryBuilder('u').where('u.active = true');
    if (query) {
      qb.andWhere(
        '(u.firstName ILIKE :q OR u.lastName ILIKE :q OR u.company ILIKE :q OR u.jobTitle ILIKE :q)',
        { q: `%${query}%` },
      );
    }
    return qb.take(50).getMany();
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getProfile(userId);
    if (dto.bio) user.bio = dto.bio;
    if (dto.linkedinUrl) user.linkedinUrl = dto.linkedinUrl;
    user.profileData = { ...user.profileData, ...dto };
    return this.userRepo.save(user);
  }

  async getMatchSuggestions(userId: number, eventId: number): Promise<User[]> {
    const user = await this.getProfile(userId);
    const userInterests = user.profileData?.interests || [];

    // Rough first pass: any active user with a company, up to 10 candidates.
    // The real ranking happens in the scoring step below — replace this
    // whole function with an embedding-based recommender when it's worth it.
    const candidates = await this.userRepo
      .createQueryBuilder('u')
      .where('u.id != :userId', { userId })
      .andWhere('u.active = true')
      .andWhere('u.company IS NOT NULL')
      .take(10)
      .getMany();

    // Score = number of shared interest tags. Ties keep query order. Users
    // with zero shared interests still surface (better than empty results).
    const scored = candidates.map((c) => {
      const theirInterests = c.profileData?.interests || [];
      const shared = userInterests.filter((i: string) => theirInterests.includes(i)).length;
      return { user: c, score: shared };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map((s) => s.user);
  }

  async scheduleMeeting(dto: ScheduleMeetingDto) {
    const meeting = {
      id: meetingStore.length + 1,
      ...dto,
      status: 'pending',
      createdAt: new Date(),
    };
    meetingStore.push(meeting);
    this.logger.log(`Meeting scheduled: ${dto.requesterId} → ${dto.recipientId}`);
    return meeting;
  }

  async getMeetings(userId: number) {
    return meetingStore.filter(
      (m) => m.requesterId === userId || m.recipientId === userId,
    );
  }

  async respondToMeeting(meetingId: number, status: 'accepted' | 'declined') {
    const meeting = meetingStore.find((m) => m.id === meetingId);
    if (!meeting) throw new NotFoundException('Meeting not found');
    meeting.status = status;
    return meeting;
  }
}
