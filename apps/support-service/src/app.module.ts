// Root module for support-service.
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket, User, Event } from '@event-platform/database';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsService } from './tickets/tickets.service';

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
      entities: [SupportTicket, User, Event],
      synchronize: process.env.DB_SYNC === 'true' && process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([SupportTicket]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class AppModule {}
