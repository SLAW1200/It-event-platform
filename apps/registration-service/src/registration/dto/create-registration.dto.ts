// Payload for creating a registration.
// `formData` is the attendee's answers; `userData`/`eventData` are extra
// context passed to the rules engine (so rules can reference user.company,
// event.country, etc); `basePrice` is the starting price the engine adjusts.
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
