// Bootstrap for analytics-service. Read-only — runs aggregate queries
// across events, registrations, check-ins, and email campaigns to power
// the organiser dashboard's charts and KPIs.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT || 3007;
  await app.listen(port);
  new Logger('AnalyticsService').log(`📊 Analytics Service running on port ${port}`);
}
bootstrap();
