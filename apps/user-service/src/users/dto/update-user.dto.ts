// Update DTO derived from CreateUserDto — every field becomes optional so
// PATCH/PUT can send partial updates. Validation decorators are inherited.
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
