import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TasksService, CreateTaskDto, AddCommentDto } from './tasks.service';
import { TaskStatus } from '@event-platform/shared';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  create(@Body() dto: CreateTaskDto) { return this.service.create(dto); }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all tasks for an event' })
  findByEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Query('status') status?: TaskStatus,
  ) { return this.service.findByEvent(eventId, status); }

  @Get('event/:eventId/kanban')
  @ApiOperation({ summary: 'Get Kanban board view' })
  getKanban(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.getKanban(eventId);
  }

  @Get('event/:eventId/stats')
  @ApiOperation({ summary: 'Get task statistics' })
  getStats(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.getStats(eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateTaskDto>) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: TaskStatus) {
    return this.service.updateStatus(id, status);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign task to user' })
  assign(@Param('id', ParseIntPipe) id: number, @Body('userId', ParseIntPipe) userId: number) {
    return this.service.assign(id, userId);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to task' })
  addComment(@Param('id', ParseIntPipe) id: number, @Body() dto: AddCommentDto) {
    return this.service.addComment(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
