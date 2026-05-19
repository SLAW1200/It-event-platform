import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationQuery, EventStatus } from '@event-platform/shared';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  create(@Body() dto: CreateEventDto, @Query('organizerId', ParseIntPipe) organizerId: number) {
    return this.eventsService.create(dto, organizerId);
  }

  @Get()
  @ApiOperation({ summary: 'List all events' })
  @ApiQuery({ name: 'status', enum: EventStatus, required: false })
  @ApiQuery({ name: 'upcoming', type: Boolean, required: false })
  findAll(@Query() query: PaginationQuery & { status?: EventStatus; upcoming?: boolean }) {
    return this.eventsService.findAll(query);
  }

  @Get('organizer/:organizerId')
  @ApiOperation({ summary: 'Get events by organizer' })
  findByOrganizer(@Param('organizerId', ParseIntPipe) organizerId: number) {
    return this.eventsService.findByOrganizer(organizerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Public view of a live event (no auth)' })
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOnePublic(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get event stats' })
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getStats(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update event' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a draft event' })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.publish(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an event' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a draft event' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.remove(id);
  }
}
