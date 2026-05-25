// Root module for networking-service. Only reads/writes User profile data —
// meeting state is kept in an in-memory array for now (see comment in the
// service file).
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@event-platform/database';
import { NetworkingController } from './profiles/networking.controller';
import { NetworkingService } from './profiles/networking.service';

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
      entities: [User],
      synchronize: process.env.DB_SYNC === 'true' && process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [NetworkingController],
  providers: [NetworkingService],
})
export class AppModule {}
