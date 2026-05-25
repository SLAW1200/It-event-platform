// Bootstrap for registration-service. Owns the `registrations` and
// `form_fields` tables plus the rules engine that decides pricing/visibility
// at signup time, and brokers Stripe payment intents + webhooks.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT || 3003;
  await app.listen(port);
  new Logger('RegistrationService').log(`📋 Registration Service running on port ${port}`);
}
bootstrap();
