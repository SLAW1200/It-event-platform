// HTTP routes for auth. All four are POSTs and all are unauthenticated —
// the gateway exempts `/auth/*` from JwtAuthGuard.
import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { GuestDto } from './dto/guest.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and get JWT tokens' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('guest')
  @ApiOperation({ summary: 'Find or create a guest (attendee) by email' })
  guest(@Body() dto: GuestDto) {
    return this.authService.findOrCreateGuest(dto);
  }

  @Post('refresh/:id')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Param('id', ParseIntPipe) id: number) {
    return this.authService.refreshToken(id);
  }
}
