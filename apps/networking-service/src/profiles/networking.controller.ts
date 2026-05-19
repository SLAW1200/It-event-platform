import {
  Controller, Get, Put, Post, Patch,
  Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NetworkingService, UpdateProfileDto, ScheduleMeetingDto } from './networking.service';

@ApiTags('Networking')
@ApiBearerAuth()
@Controller('networking')
export class NetworkingController {
  constructor(private readonly service: NetworkingService) {}

  @Get('events/:eventId/participants')
  @ApiOperation({ summary: 'Search participant directory' })
  search(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Query('q') query?: string,
  ) { return this.service.searchParticipants(eventId, query); }

  @Get('profiles/:userId')
  @ApiOperation({ summary: 'Get participant profile' })
  getProfile(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getProfile(userId);
  }

  @Put('profiles/:userId')
  @ApiOperation({ summary: 'Update participant profile' })
  updateProfile(@Param('userId', ParseIntPipe) userId: number, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(userId, dto);
  }

  @Get('events/:eventId/matches/:userId')
  @ApiOperation({ summary: 'Get AI-powered match suggestions' })
  getMatches(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) { return this.service.getMatchSuggestions(userId, eventId); }

  @Post('meetings')
  @ApiOperation({ summary: 'Schedule a 1-on-1 meeting' })
  scheduleMeeting(@Body() dto: ScheduleMeetingDto) {
    return this.service.scheduleMeeting(dto);
  }

  @Get('meetings/user/:userId')
  @ApiOperation({ summary: 'Get meetings for a user' })
  getMeetings(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getMeetings(userId);
  }

  @Patch('meetings/:meetingId/respond')
  @ApiOperation({ summary: 'Accept or decline a meeting' })
  respond(
    @Param('meetingId', ParseIntPipe) meetingId: number,
    @Body('status') status: 'accepted' | 'declined',
  ) { return this.service.respondToMeeting(meetingId, status); }
}
