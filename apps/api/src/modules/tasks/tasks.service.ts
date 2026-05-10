import { Injectable, NotFoundException } from '@nestjs/common';

import type { CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput } from '../../schema/zod';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async findAll() {
    return this.tasksRepository.findAll();
  }

  async findById(id: string) {
    const task = await this.tasksRepository.findById(id);
    if (!task) throw new NotFoundException({ error: 'Task not found' });
    return task;
  }

  async create(input: CreateTaskInput, userId: string) {
    return this.tasksRepository.create({
      title: input.title,
      description: input.description,
      processId: input.processId,
      status: input.status ?? 'todo',
      createdById: userId,
    });
  }

  async update(id: string, input: UpdateTaskInput, userId: string) {
    await this.findById(id);
    const task = await this.tasksRepository.update(id, { ...input, updatedById: userId });
    if (!task) throw new NotFoundException({ error: 'Task not found' });
    return task;
  }

  async updateStatus(id: string, input: UpdateTaskStatusInput, userId: string) {
    await this.findById(id);
    const task = await this.tasksRepository.updateStatus(id, input.status, userId);
    if (!task) throw new NotFoundException({ error: 'Task not found' });
    return task;
  }

  async remove(id: string) {
    await this.findById(id);
    const task = await this.tasksRepository.remove(id);
    if (!task) throw new NotFoundException({ error: 'Task not found' });
    return task;
  }
}
