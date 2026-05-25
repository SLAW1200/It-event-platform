// Bootstrap for checkin-service. Handles on-site QR scans + manual
// check-ins and broadcasts each scan via WebSocket so the organiser's
// dashboard updates in real time.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT || 3005;
  await app.listen(port);
  new Logger('CheckInService').log(`📱 Check-in Service running on port ${port}`);
}
bootstrap();
