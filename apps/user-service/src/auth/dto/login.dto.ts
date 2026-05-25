// Body for POST /auth/login. Password is intentionally not length-restricted
// here — login should accept any candidate so legacy hashes still validate.
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() password: string;
}
