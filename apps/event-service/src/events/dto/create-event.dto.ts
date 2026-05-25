// Payload for POST /events. `startDate`/`endDate` arrive as ISO strings
// (IsDateString) — TypeORM converts them to Date on save. The cross-field
// "end > start" check lives in EventsService.create.
import {
  IsString, IsOptional, IsDateString, IsNumber, IsEnum,
  IsPositive, Min, IsUrl, IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EventStatus } from '@event-platform/shared';

export class CreateEventDto {
  @ApiProperty({ example: 'Tech Summit 2025' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2025-09-01T09:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-09-02T18:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxParticipants?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  earlyBirdDeadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  earlyBirdPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiPropertyOptional({ description: 'Template customization (tagline, palette overrides, enabled sections, etc.)' })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
