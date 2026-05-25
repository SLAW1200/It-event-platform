// Bootstrap for user-service. Owns auth (login/register/JWT issuance) and
// the `users` table. The api-gateway proxies `/auth/*` and `/users/*` here.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('UserService');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🧑 User Service running on port ${port}`);
}
bootstrap();
