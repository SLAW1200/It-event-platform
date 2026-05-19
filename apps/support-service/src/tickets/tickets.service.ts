import {
  Injectable, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { WebClient } from '@slack/web-api';
import {
  IsString, IsNumber, IsOptional, IsEnum, IsBoolean,
} from 'class-validator';
import { SupportTicket } from '@event-platform/database';
import { TicketStatus, TicketPriority } from '@event-platform/shared';

// Decorators are required: the global ValidationPipe runs `whitelist: true`,
// which strips any property without a validation decorator.
export class CreateTicketDto {
  @IsOptional() @IsNumber() eventId?: number;
  @IsNumber() userId: number;
  @IsString() subject: string;
  @IsString() description: string;
  @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
  @IsOptional() @IsString() channel?: string;
}

export class ReplyDto {
  @IsNumber() senderId: number;
  @IsString() content: string;
  @IsOptional() @IsBoolean() isInternal?: boolean;
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  private readonly slack: WebClient;

  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
  ) {
    if (process.env.SLACK_BOT_TOKEN) {
      this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    }
  }

  async create(dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketRepo.create({
      ...dto,
      slaDueAt: this.calculateSLA(dto.priority || TicketPriority.MEDIUM),
    });
    const saved = await this.ticketRepo.save(ticket);
    await this.notifySlack(saved);
    this.logger.log(`Ticket #${saved.id} created: ${saved.subject}`);
    return saved;
  }

  async findAll(status?: TicketStatus, priority?: TicketPriority): Promise<SupportTicket[]> {
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    return this.ticketRepo.find({
      where,
      relations: { user: true, assignedTo: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: { user: true, assignedTo: true },
    });
    if (!ticket) throw new NotFoundException(`Ticket #${id} not found`);
    return ticket;
  }

  async reply(id: number, dto: ReplyDto): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }
    ticket.messages = [
      ...ticket.messages,
      { senderId: dto.senderId, content: dto.content, isInternal: dto.isInternal || false, createdAt: new Date() },
    ];
    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }
    return this.ticketRepo.save(ticket);
  }

  async assign(id: number, agentId: number): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    ticket.assignedToId = agentId;
    ticket.status = TicketStatus.IN_PROGRESS;
    return this.ticketRepo.save(ticket);
  }

  async resolve(id: number): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    ticket.status = TicketStatus.RESOLVED;
    ticket.resolvedAt = new Date();
    return this.ticketRepo.save(ticket);
  }

  async close(id: number): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    ticket.status = TicketStatus.CLOSED;
    return this.ticketRepo.save(ticket);
  }

  async escalate(id: number): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    ticket.priority = TicketPriority.CRITICAL;
    await this.ticketRepo.save(ticket);
    await this.notifySlack(ticket, '🚨 *ESCALATED*');
    return ticket;
  }

  async findBreachedSLA(): Promise<SupportTicket[]> {
    return this.ticketRepo.find({
      where: {
        slaDueAt: LessThan(new Date()),
        status: TicketStatus.OPEN,
      },
    });
  }

  async getStats() {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.ticketRepo.count(),
      this.ticketRepo.count({ where: { status: TicketStatus.OPEN } }),
      this.ticketRepo.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.ticketRepo.count({ where: { status: TicketStatus.RESOLVED } }),
      this.ticketRepo.count({ where: { status: TicketStatus.CLOSED } }),
    ]);
    return { total, open, inProgress, resolved, closed };
  }

  private calculateSLA(priority: TicketPriority): Date {
    const hours = { low: 72, medium: 24, high: 8, critical: 2 };
    const due = new Date();
    due.setHours(due.getHours() + (hours[priority] || 24));
    return due;
  }

  private async notifySlack(ticket: SupportTicket, prefix = '🎫 *New Ticket*') {
    if (!this.slack || !process.env.SLACK_SUPPORT_CHANNEL) return;
    try {
      await this.slack.chat.postMessage({
        channel: process.env.SLACK_SUPPORT_CHANNEL,
        text: `${prefix} #${ticket.id}: ${ticket.subject}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${prefix}\n*#${ticket.id}:* ${ticket.subject}\n*Priority:* ${ticket.priority}\n*Channel:* ${ticket.channel || 'web'}`,
            },
          },
        ],
      });
    } catch (err) {
      this.logger.warn(`Slack notification failed: ${err.message}`);
    }
  }
}
