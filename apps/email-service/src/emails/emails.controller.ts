import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CampaignsService } from '../campaigns/campaigns.service';
import { RegistrationConfirmationDto } from './dto/registration-confirmation.dto';

@ApiTags('Transactional Email')
@Controller('emails')
export class EmailsController {
  constructor(private readonly service: CampaignsService) {}

  @Post('registration-confirmation')
  @ApiOperation({ summary: 'Send a post-registration confirmation (details + QR)' })
  registrationConfirmation(@Body() dto: RegistrationConfirmationDto) {
    return this.service.sendRegistrationConfirmation(dto);
  }
}
