import { Controller, Post, Get, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckInService } from './checkin.service';

class QrCheckInDto {
  @ApiProperty() @IsString() qrPayload: string;
  @ApiProperty() @IsNumber() staffId: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() sessionId?: number;
}

class ManualCheckInDto {
  @ApiProperty() @IsNumber() registrationId: number;
  @ApiProperty() @IsNumber() staffId: number;
}

@ApiTags('Check-in')
@ApiBearerAuth()
@Controller('checkin')
export class CheckInController {
  constructor(private readonly service: CheckInService) {}

  @Post('qr')
  @ApiOperation({ summary: 'Process QR code check-in' })
  qrCheckIn(@Body() dto: QrCheckInDto) {
    return this.service.processQrCheckIn(dto.qrPayload, dto.staffId, dto.sessionId);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Manual check-in by registration ID' })
  manualCheckIn(@Body() dto: ManualCheckInDto) {
    return this.service.manualCheckIn(dto.registrationId, dto.staffId);
  }

  @Get('event/:eventId/attendance')
  @ApiOperation({ summary: 'Get live attendance stats for an event' })
  getAttendance(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.getEventAttendance(eventId);
  }

  @Get('event/:eventId/session/:sessionId')
  @ApiOperation({ summary: 'Get check-ins for a specific session' })
  getSessionCheckIns(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.service.getCheckInsBySession(eventId, sessionId);
  }
}
