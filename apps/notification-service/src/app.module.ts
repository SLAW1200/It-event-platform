// Root module for notification-service. No DB — this service is purely an
// outbound relay so it can scale horizontally and restart freely.
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    NotificationsModule,
  ],
})
export class AppModule {}
