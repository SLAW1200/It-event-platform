// HTTP routes for registrations. POST /public is the only unauthenticated
// path — used by the attendee-facing event page. POST /webhook/stripe takes
// a RawBodyRequest because Stripe signature verification requires the
// untouched JSON bytes.
import {
  Controller, Get, Post, Patch, Body,
  Param, ParseIntPipe, Query, RawBodyRequest, Req, Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@ApiTags('Registrations')
@ApiBearerAuth()
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly service: RegistrationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a registration' })
  create(@Body() dto: CreateRegistrationDto) {
    return this.service.create(dto);
  }

  @Post('public')
  @ApiOperation({ summary: 'Attendee self-registration from the public event page (no auth)' })
  createPublic(@Body() dto: CreateRegistrationDto) {
    return this.service.create(dto, { enforcePublished: true });
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all registrations for an event' })
  findByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.findByEvent(eventId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get registrations for a user' })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.findByUser(userId);
  }

  @Get('event/:eventId/stats')
  @ApiOperation({ summary: 'Get registration statistics for an event' })
  getStats(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.getEventStats(eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single registration' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm a registration' })
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.service.confirm(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a registration' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id);
  }

  @Post(':id/payment-intent')
  @ApiOperation({ summary: 'Create Stripe payment intent for registration' })
  createPaymentIntent(@Param('id', ParseIntPipe) id: number) {
    return this.service.createPaymentIntent(id);
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.service.handleStripeWebhook(req.rawBody, sig);
  }
}
