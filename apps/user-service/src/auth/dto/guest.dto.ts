import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Lightweight identity for attendee self-registration on the public event
 * page. No password — a guest gets a PARTICIPANT account they can later
 * claim by registering normally with the same email.
 */
export class GuestDto {
  @ApiProperty({ example: 'attendee@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Lovelace' })
  @IsString()
  lastName: string;
}
