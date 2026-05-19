import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FormBuilderService, CreateFormFieldDto } from './form-builder.service';

@ApiTags('Form Builder')
@Controller('form-fields')
export class FormBuilderController {
  constructor(private readonly service: FormBuilderService) {}

  @Post()
  @ApiOperation({ summary: 'Add a form field' })
  create(@Body() dto: CreateFormFieldDto) { return this.service.create(dto); }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all form fields for an event' })
  findByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.service.findByEvent(eventId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a form field' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateFormFieldDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a form field' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Post('event/:eventId/reorder')
  @ApiOperation({ summary: 'Reorder form fields' })
  reorder(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: { orderedIds: number[] },
  ) { return this.service.reorder(eventId, body.orderedIds); }
}
