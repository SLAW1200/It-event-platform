// Transactional-email entry points. Server-to-server only — called by other
// services (registration-service triggers these across the signup lifecycle).
// One endpoint per milestone:
//   POST /emails/registration  → "we received your registration" (paid, pending)
//   POST /emails/payment       → payment receipt (Stripe confirmed)
//   POST /emails/confirmation  → "you're confirmed" + check-in QR
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CampaignsService } from '../campaigns/campaigns.service';
import {
  RegistrationEmailDto,
  PaymentEmailDto,
  ConfirmationEmailDto,
} from './dto/registration-confirmation.dto';

@ApiTags('Transactional Email')
@Controller('emails')
export class EmailsController {
  constructor(private readonly service: CampaignsService) {}

  @Post('registration')
  @ApiOperation({ summary: 'Acknowledge a registration (paid signup, payment pending)' })
  registration(@Body() dto: RegistrationEmailDto) {
    return this.service.sendRegistrationReceived(dto);
  }

  @Post('payment')
  @ApiOperation({ summary: 'Send a payment receipt' })
  payment(@Body() dto: PaymentEmailDto) {
    return this.service.sendPaymentReceipt(dto);
  }

  @Post('confirmation')
  @ApiOperation({ summary: 'Confirm a registration (details + check-in QR)' })
  confirmation(@Body() dto: ConfirmationEmailDto) {
    return this.service.sendConfirmation(dto);
  }
}
