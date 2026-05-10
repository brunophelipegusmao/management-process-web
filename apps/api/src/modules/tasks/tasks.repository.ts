import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '../../infra/database/client';
import { processes, tasks, users } from '../../schema';
import type { Task } from '../../schema';

const createdByUser = alias(users, 'created_by_user');
const updatedByUser = alias(users, 'updated_by_user');

export type TaskEntity = Task;

export type TaskWithContext = {
  id: string;
  title: string;
  description: string | null;
  status: TaskEntity['status'];
  processId: string | null;
  cnjNumber: string | null;
  authorName: string | null;
  defendantName: string | null;
  createdById: string;
  createdByName: string | null;
  updatedById: string | null;
  updatedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTaskRecord = {
  title: string;
  description?: string;
  processId?: string;
  status?: TaskEntity['status'];
  createdById: string;
};

export type UpdateTaskRecord = {
  title?: string;
  description?: string;
  processId?: string;
  status?: TaskEntity['status'];
  updatedById: string;
};

@Injectable()
export class TasksRepository {
  async findAll(): Promise<TaskWithContext[]> {
    return db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        processId: tasks.processId,
        cnjNumber: processes.cnjNumber,
        authorName: processes.authorName,
        defendantName: processes.defendantName,
        createdById: tasks.createdById,
        createdByName: createdByUser.name,
        updatedById: tasks.updatedById,
        updatedByName: updatedByUser.name,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .leftJoin(processes, eq(tasks.processId, processes.id))
      .leftJoin(createdByUser, eq(tasks.createdById, createdByUser.id))
      .leftJoin(updatedByUser, eq(tasks.updatedById, updatedByUser.id))
      .orderBy(desc(tasks.createdAt));
  }

  async findById(id: string): Promise<TaskEntity | null> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    return task ?? null;
  }

  async create(input: CreateTaskRecord): Promise<TaskEntity> {
    const [task] = await db
      .insert(tasks)
      .values({
        title: input.title,
        description: input.description,
        processId: input.processId,
        status: input.status ?? 'todo',
        createdById: input.createdById,
      })
      .returning();
    return task;
  }

  async update(id: string, input: UpdateTaskRecord): Promise<TaskEntity | null> {
    const [task] = await db
      .update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task ?? null;
  }

  async updateStatus(
    id: string,
    status: TaskEntity['status'],
    updatedById: string,
  ): Promise<TaskEntity | null> {
    const [task] = await db
      .update(tasks)
      .set({ status, updatedById, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task ?? null;
  }

  async remove(id: string): Promise<TaskEntity | null> {
    const [task] = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    return task ?? null;
  }
}
