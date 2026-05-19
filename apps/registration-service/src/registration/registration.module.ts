import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration, FormField, Event } from '@event-platform/database';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { RulesEngineModule } from '../rules-engine/rules-engine.module';

@Module({
  imports: [TypeOrmModule.forFeature([Registration, FormField, Event]), RulesEngineModule],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
