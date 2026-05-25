import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Passwordless identity for public self-registration. The PARTICIPANT account
// can later be claimed by registering normally with the same email.
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
