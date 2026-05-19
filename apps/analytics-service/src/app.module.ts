import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User, Event, Registration, FormField, CheckIn,
  EmailCampaign, Task, SupportTicket,
} from '@event-platform/database';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';

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
    TypeOrmModule.forFeature([Registration, CheckIn, EmailCampaign, Event]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AppModule {}
