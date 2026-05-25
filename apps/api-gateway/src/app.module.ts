import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { ProxyModule } from './proxy/proxy.module';
import { AuthModule } from './auth/auth.module';
import { LoggingMiddleware } from './middleware/logging.middleware';

@Module({
  imports: [
    // Loads `.env` (service-local) and then `../../.env` (monorepo root) —
    // local file wins on key collision.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),

    // Three tiers of rate limiting applied together: burst (20/sec),
    // sustained (100/10s), session (500/min). Hitting any one returns 429.
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 500 },
    ]),

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),

    AuthModule,
    ProxyModule,
  ],
})
export class AppModule {
  // Log every request that hits the gateway — handy for tracing requests
  // across microservices via the X-Request-ID header.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
