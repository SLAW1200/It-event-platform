import {
  Controller, Get, Post, Patch, Body,
  Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketsService, CreateTicketDto, ReplyDto } from './tickets.service';
import { TicketStatus, TicketPriority } from '@event-platform/shared';

@ApiTags('Support Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create support ticket' })
  create(@Body() dto: CreateTicketDto) { return this.service.create(dto); }

  @Get()
  @ApiOperation({ summary: 'List all tickets' })
  findAll(@Query('status') status?: TicketStatus, @Query('priority') priority?: TicketPriority) {
    return this.service.findAll(status, priority);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  getStats() { return this.service.getStats(); }

  @Get('breached-sla')
  @ApiOperation({ summary: 'Get SLA-breached tickets' })
  getBreached() { return this.service.findBreachedSLA(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a ticket' })
  reply(@Param('id', ParseIntPipe) id: number, @Body() dto: ReplyDto) {
    return this.service.reply(id, dto);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign ticket to agent' })
  assign(@Param('id', ParseIntPipe) id: number, @Body('agentId', ParseIntPipe) agentId: number) {
    return this.service.assign(id, agentId);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve ticket' })
  resolve(@Param('id', ParseIntPipe) id: number) { return this.service.resolve(id); }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close ticket' })
  close(@Param('id', ParseIntPipe) id: number) { return this.service.close(id); }

  @Patch(':id/escalate')
  @ApiOperation({ summary: 'Escalate ticket to critical' })
  escalate(@Param('id', ParseIntPipe) id: number) { return this.service.escalate(id); }
}
