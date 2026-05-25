// Form-builder feature module — registers the FormField repository and
// re-exports the service so RegistrationModule can read fields during signup.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormField } from '@event-platform/database';
import { FormBuilderController } from './form-builder.controller';
import { FormBuilderService } from './form-builder.service';

@Module({
  imports: [TypeOrmModule.forFeature([FormField])],
  controllers: [FormBuilderController],
  providers: [FormBuilderService],
  exports: [FormBuilderService],
})
export class FormBuilderModule {}
