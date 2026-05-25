// CRUD for the per-event registration form fields (rendered in orderIndex order).
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, IsObject,
} from 'class-validator';
import { FormField } from '@event-platform/database';
import { FormFieldType } from '@event-platform/shared';

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

  // Rewrites orderIndex on every field in one pass. Issued as parallel
  // updates rather than a single transaction because there are at most a
  // few dozen fields per event and order doesn't matter mid-batch.
  async reorder(eventId: number, orderedIds: number[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.repo.update(id, { orderIndex: index }),
      ),
    );
  }
}
