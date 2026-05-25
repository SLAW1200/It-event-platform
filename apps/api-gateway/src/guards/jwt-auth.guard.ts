// JWT guard plus the @Public() / @Roles() decorators it reads. Verifies the
// bearer token, attaches the payload as req.user, and enforces roles if declared.
import {
  CanActivate, ExecutionContext, Injectable,
  UnauthorizedException, SetMetadata,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// Metadata key for `@Public()` — read by the reflector below to bypass auth.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Metadata key for `@Roles('admin', ...)` — enforced after token verification.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // `@Public()` short-circuits — useful for healthchecks, webhooks, etc.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('No token provided');

    try {
      // Throws on expired/forged tokens — handled by the catch below.
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request['user'] = payload;

      // Role check — only runs if the handler/class declared @Roles().
      // Currently a flat allow-list; replace with hierarchy if needed.
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (requiredRoles?.length && !requiredRoles.includes(payload.role)) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      return true;
    } catch {
      // Deliberately opaque error — don't leak whether the token was expired
      // vs forged vs signed with the wrong secret.
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
