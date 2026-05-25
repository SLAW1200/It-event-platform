// Bootstrap for file-service. Pure S3 wrapper — accepts multipart uploads,
// pushes to a single bucket organised by folder prefix, and mints signed
// URLs for private downloads.
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT || 3008;
  await app.listen(port);
  new Logger('FileService').log(`📁 File Service running on port ${port}`);
}
bootstrap();
