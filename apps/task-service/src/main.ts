// Bootstrap for task-service. Owns the `tasks` table — organiser-side
// todo board for each event (catering, AV, signage…). Powers the Kanban
// view on the dashboard.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT || 3009;
  await app.listen(port);
  new Logger('TaskService').log(`✅ Task Service running on port ${port}`);
}
bootstrap();
