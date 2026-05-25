// Root module — wires the three feature modules: form-builder (CRUD for
// dynamic form fields), rules-engine (pure evaluator, no DB), and
// registration (signup, payment, confirmation).
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration, FormField, User, Event } from '@event-platform/database';
import { RegistrationModule } from './registration/registration.module';
import { RulesEngineModule } from './rules-engine/rules-engine.module';
import { FormBuilderModule } from './form-builder/form-builder.module';

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
      entities: [Registration, FormField, User, Event],
      synchronize: process.env.DB_SYNC === 'true' && process.env.NODE_ENV !== 'production',
    }),
    RulesEngineModule,
    FormBuilderModule,
    RegistrationModule,
  ],
})
export class AppModule {}
