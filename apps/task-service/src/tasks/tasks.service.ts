// CRUD for organiser todos plus the Kanban + stats views.
import {
  Injectable, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsNumber, IsOptional, IsEnum, IsDateString,
} from 'class-validator';
import { Task } from '@event-platform/database';
import { TaskStatus, TaskPriority } from '@event-platform/shared';

export class CreateTaskDto {
  @IsNumber() eventId: number;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() assignedToId?: number;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsNumber() estimatedHours?: number;
}

export class AddCommentDto {
  @IsNumber() userId: number;
  @IsString() text: string;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepo.create({
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });
    return this.taskRepo.save(task);
  }

  async findByEvent(eventId: number, status?: TaskStatus): Promise<Task[]> {
    const where: any = { eventId };
    if (status) where.status = status;
    return this.taskRepo.find({
      where,
      relations: { assignedTo: true },
      order: { priority: 'DESC', dueDate: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: { assignedTo: true },
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async update(id: number, dto: Partial<CreateTaskDto>): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status;
    return this.taskRepo.save(task);
  }

  async addComment(id: number, dto: AddCommentDto): Promise<Task> {
    const task = await this.findOne(id);
    task.comments = [
      ...task.comments,
      { userId: dto.userId, text: dto.text, createdAt: new Date() },
    ];
    return this.taskRepo.save(task);
  }

  async assign(id: number, userId: number): Promise<Task> {
    const task = await this.findOne(id);
    task.assignedToId = userId;
    return this.taskRepo.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepo.remove(task);
  }

  // One query, four buckets — cheaper than four separate WHERE-filtered
  // queries and order is preserved across columns for the drag-and-drop UI.
  async getKanban(eventId: number): Promise<Record<TaskStatus, Task[]>> {
    const tasks = await this.findByEvent(eventId);
    return {
      [TaskStatus.TODO]: tasks.filter((t) => t.status === TaskStatus.TODO),
      [TaskStatus.IN_PROGRESS]: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
      [TaskStatus.REVIEW]: tasks.filter((t) => t.status === TaskStatus.REVIEW),
      [TaskStatus.DONE]: tasks.filter((t) => t.status === TaskStatus.DONE),
    };
  }

  async getStats(eventId: number) {
    const tasks = await this.findByEvent(eventId);
    return {
      total: tasks.length,
      byStatus: Object.values(TaskStatus).reduce((acc, s) => {
        acc[s] = tasks.filter((t) => t.status === s).length;
        return acc;
      }, {} as Record<string, number>),
      byPriority: Object.values(TaskPriority).reduce((acc, p) => {
        acc[p] = tasks.filter((t) => t.priority === p).length;
        return acc;
      }, {} as Record<string, number>),
      // Overdue = past due AND not yet DONE. Completed-late tasks are
      // intentionally not flagged so the dashboard doesn't nag for closed work.
      overdue: tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE,
      ).length,
    };
  }
}
