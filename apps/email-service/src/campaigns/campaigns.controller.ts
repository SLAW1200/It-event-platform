import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, SendCampaignDto } from './dto/create-campaign.dto';

@ApiTags('Email Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create email campaign' })
  create(@Body() dto: CreateCampaignDto) { return this.service.create(dto); }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get campaigns by event' })
  findByEvent(@Param('eventId', ParseIntPipe) id: number) { return this.service.findByEvent(id); }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateCampaignDto>) {
    return this.service.update(id, dto);
  }

  @Patch(':id/schedule')
  @ApiOperation({ summary: 'Schedule campaign' })
  schedule(@Param('id', ParseIntPipe) id: number, @Body('scheduledTime') time: string) {
    return this.service.schedule(id, new Date(time));
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send campaign to recipients' })
  send(@Param('id', ParseIntPipe) id: number, @Body() dto: SendCampaignDto) {
    return this.service.send(id, dto);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics' })
  analytics(@Param('id', ParseIntPipe) id: number) { return this.service.getAnalytics(id); }

  @Post(':id/track-open')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track email open (pixel endpoint)' })
  trackOpen(@Param('id', ParseIntPipe) id: number) { return this.service.trackOpen(id); }

  @Post(':id/track-click')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track link click' })
  trackClick(@Param('id', ParseIntPipe) id: number) { return this.service.trackClick(id); }
}
