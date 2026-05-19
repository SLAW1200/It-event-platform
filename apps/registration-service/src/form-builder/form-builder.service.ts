// form-builder.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, IsObject,
} from 'class-validator';
import { FormField } from '@event-platform/database';
import { FormFieldType } from '@event-platform/shared';

// Decorators required: the global ValidationPipe runs `whitelist: true`,
// which strips any property without a validation decorator.
export class CreateFormFieldDto {
  @IsNumber() eventId: number;
  @IsString() fieldName: string;
  @IsString() label: string;
  @IsEnum(FormFieldType) fieldType: FormFieldType;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsArray() options?: string[];
  @IsOptional() @IsObject() validationRules?: Record<string, any>;
  @IsOptional() @IsObject() conditionalLogic?: Record<string, any>;
  @IsOptional() @IsNumber() orderIndex?: number;
  @IsOptional() @IsString() placeholder?: string;
  @IsOptional() @IsString() helpText?: string;
}

@Injectable()
export class FormBuilderService {
  constructor(
    @InjectRepository(FormField)
    private readonly repo: Repository<FormField>,
  ) {}

  async create(dto: CreateFormFieldDto): Promise<FormField> {
    const field = this.repo.create(dto);
    return this.repo.save(field);
  }

  async findByEvent(eventId: number): Promise<FormField[]> {
    return this.repo.find({
      where: { eventId },
      order: { orderIndex: 'ASC' },
    });
  }

  async update(id: number, dto: Partial<CreateFormFieldDto>): Promise<FormField> {
    const field = await this.repo.findOne({ where: { id } });
    if (!field) throw new NotFoundException(`FormField #${id} not found`);
    Object.assign(field, dto);
    return this.repo.save(field);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async reorder(eventId: number, orderedIds: number[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.repo.update(id, { orderIndex: index }),
      ),
    );
  }
}
