import { IsString, IsNumber, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty() @IsNumber() eventId: number;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() subject: string;
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() htmlContent?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emailProvider?: string;
}

export class RecipientDto {
  @IsString() email: string;
  @IsOptional() @IsString() name?: string;
  [key: string]: any;
}

// `recipients` needs @IsArray or the whitelist pipe strips it out entirely.
export class SendCampaignDto {
  @IsArray() recipients: RecipientDto[];
  @IsOptional() @IsString() provider?: 'brevo' | 'sendgrid' | 'ses';
}
