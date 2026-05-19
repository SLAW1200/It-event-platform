import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Platform-wide overview stats' })
  getPlatformOverview() { return this.service.getPlatformOverview(); }

  @Get('events/:eventId/dashboard')
  @ApiOperation({ summary: 'Full event analytics dashboard' })
  getDashboard(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.getEventDashboard(eventId);
  }

  @Get('events/:eventId/registrations/timeline')
  @ApiOperation({ summary: 'Registration count over time' })
  getRegistrationTimeline(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.getRegistrationTimeline(eventId);
  }

  @Get('events/:eventId/checkins/timeline')
  @ApiOperation({ summary: 'Check-in count per hour' })
  getCheckInTimeline(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.getCheckInTimeline(eventId);
  }

  @Get('events/:eventId/pricing-breakdown')
  @ApiOperation({ summary: 'Revenue breakdown by pricing tier' })
  getPricingBreakdown(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.getPricingBreakdown(eventId);
  }
}
