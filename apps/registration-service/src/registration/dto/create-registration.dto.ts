// ─── dto/create-registration.dto.ts ──────────────────────────────────────────
import { IsNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiProperty() @IsNumber() eventId: number;
  @ApiProperty() @IsNumber() userId: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() formData?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsObject() userData?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsObject() eventData?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsNumber() basePrice?: number;
}
