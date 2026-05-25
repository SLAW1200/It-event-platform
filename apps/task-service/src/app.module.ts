// Root module for task-service. Only `Task` is actively injected; the
// other entities are listed so TypeORM keeps the full schema in sync when
// running with synchronize: true in dev.
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User, Event, Registration, FormField, CheckIn,
  EmailCampaign, Task, SupportTicket,
} from '@event-platform/database';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      database: process.env.DATABASE_NAME || 'it_event_platform',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      entities: [User, Event, Registration, FormField, CheckIn, EmailCampaign, Task, SupportTicket],
      synchronize: process.env.DB_SYNC === 'true' && process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Task]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class AppModule {}
