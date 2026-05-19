import {
  Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '@event-platform/database';
import { PaginationQuery, PaginatedResponse } from '@event-platform/shared';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const { password, ...rest } = dto;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ ...rest, passwordHash });
    const saved = await this.userRepo.save(user);
    this.logger.log(`Created user ${saved.id} - ${saved.email}`);
    delete (saved as Partial<User>).passwordHash;
    return saved;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findAll(query: PaginationQuery): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { firstName: ILike(`%${search}%`) },
          { lastName: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { company: ILike(`%${search}%`) },
        ]
      : {};

    const [data, total] = await this.userRepo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByCognitoId(cognitoId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { cognitoId } });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async updateStatus(id: number, active: boolean): Promise<User> {
    const user = await this.findOne(id);
    user.active = active;
    return this.userRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
    this.logger.log(`Removed user ${id}`);
  }

  async bulkCreate(dtos: CreateUserDto[]): Promise<User[]> {
    const users = dtos.map((dto) => this.userRepo.create(dto));
    return this.userRepo.save(users);
  }

  async countByRole(): Promise<Record<string, number>> {
    const result = await this.userRepo
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();
    return Object.fromEntries(result.map((r) => [r.role, parseInt(r.count)]));
  }
}
