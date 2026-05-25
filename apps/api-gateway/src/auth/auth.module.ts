// Registers the Passport JWT strategy globally so any `@UseGuards(AuthGuard())`
// elsewhere in the gateway can verify bearer tokens. Re-exports PassportModule
// for convenience.
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
