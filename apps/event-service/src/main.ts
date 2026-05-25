// Bootstrap for event-service. Owns the `events` table — CRUD plus
// publish/cancel state transitions, organiser scoping, and the public
// landing-page read endpoint.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT || 3002;
  await app.listen(port);
  new Logger('EventService').log(`📅 Event Service running on port ${port}`);
}
bootstrap();
