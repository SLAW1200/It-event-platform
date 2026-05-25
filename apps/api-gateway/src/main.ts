// Single ingress in front of every service: validates JWTs, applies
// CORS/helmet, then proxies to the right downstream (see proxy.service.ts).
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('APIGateway');
  const isProd = process.env.NODE_ENV === 'production';

  // Fail fast on misconfiguration in prod — a weak/missing JWT secret would
  // let anyone forge tokens. In dev we only warn so local boot still works.
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    if (isProd) {
      throw new Error('JWT_SECRET must be set to a 32+ character secret in production');
    }
    logger.warn('JWT_SECRET is missing or weak — acceptable in dev only');
  }

  // CORS allow-list must be explicit in prod; reflecting any origin would
  // defeat the SameSite cookie protection.
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
  if (isProd && (!allowedOrigins || allowedOrigins.length === 0)) {
    throw new Error('ALLOWED_ORIGINS must be set in production (comma-separated)');
  }

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: allowedOrigins ?? ['http://localhost:3100'], // dev fallback = Next dev server
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // whitelist + forbidNonWhitelisted drop/reject unknown DTO fields; transform
  // coerces query strings so controllers don't parse them by hand.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api/v1');

  // Kept out of production so the API surface isn't publicly enumerable.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('IT Event Platform API')
      .setDescription('Comprehensive event management platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger available at /api/docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 API Gateway running on port ${port}`);
}

bootstrap();
