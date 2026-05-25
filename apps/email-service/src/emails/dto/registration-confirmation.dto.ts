import { IsEmail, IsObject, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Event details rendered into every transactional email. */
export interface ConfirmationEventInfo {
  name: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  city?: string;
  country?: string;
  description?: string;
}

// Acknowledgement for a paid signup that's still awaiting payment. No QR here —
// that goes out with the confirmation once the spot is secured.
export class RegistrationEmailDto {
  @ApiProperty({ example: 'attendee@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Maya Rao' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Amount still owed before the spot is confirmed' })
  @IsOptional()
  @IsNumber()
  amountDue?: number;

  @ApiPropertyOptional({ example: 'usd' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Event details rendered into the email' })
  @IsObject()
  event: ConfirmationEventInfo;
}

// Receipt sent once Stripe confirms the charge.
export class PaymentEmailDto {
  @ApiProperty({ example: 'attendee@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Maya Rao' })
  @IsString()
  name: string;

  @ApiProperty({ example: 149.0, description: 'Amount charged' })
  @IsNumber()
  amountPaid: number;

  @ApiPropertyOptional({ example: 'usd' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'early-bird' })
  @IsOptional()
  @IsString()
  pricingTier?: string;

  @ApiProperty({ description: 'Event details rendered into the email' })
  @IsObject()
  event: ConfirmationEventInfo;
}

// The ticket: carries the check-in QR. Sent immediately for free events, or
// after payment clears for paid ones.
export class ConfirmationEmailDto {
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
