// Passport JWT strategy. The user-service is the only issuer; the gateway
// only verifies signatures and expiry, then exposes `req.user` to handlers.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Falls back to a dev secret so local boot works without env vars.
      // main.ts already enforces a strong secret in production.
      secretOrKey: process.env.JWT_SECRET || 'local-dev-secret-change-in-prod',
    });
  }

  // Shape returned here is attached as `req.user`. Keep it small — only what
  // downstream handlers need (sub = userId, email, role).
  async validate(payload: any) {
    if (!payload?.sub) throw new UnauthorizedException();
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
