import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService, SendNotificationDto } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Send a notification' })
  send(@Body() dto: SendNotificationDto) { return this.service.send(dto); }

  @Post('bulk')
  @ApiOperation({ summary: 'Send bulk notifications' })
  sendBulk(@Body() dtos: SendNotificationDto[]) { return this.service.sendBulk(dtos); }

  @Get('log')
  @ApiOperation({ summary: 'Get recent notification log' })
  getLog() { return this.service.getLog(); }
}
