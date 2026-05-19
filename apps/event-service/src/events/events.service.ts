import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike, MoreThanOrEqual } from 'typeorm';
import { Event } from '@event-platform/database';
import { EventStatus, PaginationQuery, PaginatedResponse } from '@event-platform/shared';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async create(dto: CreateEventDto, organizerId: number): Promise<Event> {
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }
    const event = this.eventRepo.create({ ...dto, organizerId });
    const saved = await this.eventRepo.save(event);
    this.logger.log(`Created event ${saved.id}: ${saved.name}`);
    return saved;
  }

  async findAll(
    query: PaginationQuery & { status?: EventStatus; upcoming?: boolean },
  ): Promise<PaginatedResponse<Event>> {
    const { page = 1, limit = 20, search, sortBy = 'startDate', sortOrder = 'ASC', status, upcoming } = query;
    const skip = (page - 1) * limit;

    const qb = this.eventRepo.createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .skip(skip)
      .take(limit)
      .orderBy(`event.${sortBy}`, sortOrder);

    if (search) {
      qb.andWhere('(event.name ILIKE :s OR event.description ILIKE :s OR event.city ILIKE :s)', {
        s: `%${search}%`,
      });
    }
    if (status) qb.andWhere('event.status = :status', { status });
    if (upcoming) qb.andWhere('event.startDate >= :now', { now: new Date() });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: { organizer: true },
    });
    if (!event) throw new NotFoundException(`Event #${id} not found`);
    return event;
  }

  /**
   * Public, unauthenticated view of a single event. Loads no organizer
   * relation (avoids leaking organizer PII) and only resolves events that
   * are live — drafts/cancelled return 404 so they stay private until the
   * organizer publishes from the dashboard.
   */
  async findOnePublic(id: number): Promise<Event> {
    const event = await this.eventRepo.findOne({ where: { id } });
    const visible = [
      EventStatus.PUBLISHED,
      EventStatus.ONGOING,
      EventStatus.COMPLETED,
    ];
    if (!event || !visible.includes(event.status)) {
      throw new NotFoundException(`Event #${id} not found`);
    }
    return event;
  }

  async findByOrganizer(organizerId: number): Promise<Event[]> {
    return this.eventRepo.find({
      where: { organizerId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  async publish(id: number): Promise<Event> {
    const event = await this.findOne(id);
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be published');
    }
    event.status = EventStatus.PUBLISHED;
    return this.eventRepo.save(event);
  }

  async cancel(id: number): Promise<Event> {
    const event = await this.findOne(id);
    if (event.status === EventStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed event');
    }
    event.status = EventStatus.CANCELLED;
    return this.eventRepo.save(event);
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    if (event.status === EventStatus.PUBLISHED || event.status === EventStatus.ONGOING) {
      throw new BadRequestException('Cannot delete a live event. Cancel it first.');
    }
    await this.eventRepo.remove(event);
  }

  async getStats(id: number): Promise<Record<string, any>> {
    const event = await this.findOne(id);
    return {
      eventId: id,
      name: event.name,
      status: event.status,
      maxParticipants: event.maxParticipants,
      daysUntilStart: Math.ceil(
        (new Date(event.startDate).getTime() - Date.now()) / 86400000,
      ),
    };
  }
}
