import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface ConfirmationEventInfo {
  name: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  city?: string;
  country?: string;
  description?: string;
}

/**
 * Payload for the post-registration confirmation email. Sent server-to-server
 * by registration-service after a participant joins a published event.
 */
export class RegistrationConfirmationDto {
  @ApiProperty({ example: 'attendee@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Maya Rao' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'confirmed' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Check-in QR code as a data URL' })
  @IsOptional()
  @IsString()
  qrCodeUrl?: string;

  @ApiProperty({ description: 'Event details rendered into the email' })
  @IsObject()
  event: ConfirmationEventInfo;
}
