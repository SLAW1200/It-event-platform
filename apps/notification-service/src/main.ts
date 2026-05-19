import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT || 3006;
  await app.listen(port);
  new Logger('NotificationService').log(`🔔 Notification Service running on port ${port}`);
}
bootstrap();
