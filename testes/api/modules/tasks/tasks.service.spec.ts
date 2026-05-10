import { NotFoundException } from '@nestjs/common';

import { TasksService } from '../../../../apps/api/src/modules/tasks/tasks.service';
import type {
   TasksRepository,
   TaskWithContext,
} from '../../../../apps/api/src/modules/tasks/tasks.repository';
import type { Task } from '../../../../apps/api/src/schema';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

const USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TASK_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function buildTaskEntity(overrides: Partial<Task> = {}): Task {
   return {
      id: TASK_ID,
      title: 'Tarefa de teste',
      description: null,
      status: 'todo',
      processId: null,
      createdById: USER_ID,
      updatedById: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
   };
}

function buildTaskWithContext(
   overrides: Partial<TaskWithContext> = {},
): TaskWithContext {
   return {
      id: TASK_ID,
      title: 'Tarefa de teste',
      description: null,
      status: 'todo',
      processId: null,
      cnjNumber: null,
      authorName: null,
      defendantName: null,
      createdById: USER_ID,
      createdByName: 'Usuário Teste',
      updatedById: null,
      updatedByName: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
   };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TasksService', () => {
   let service: TasksService;
   let repository: jest.Mocked<TasksRepository>;

   beforeEach(() => {
      repository = {
         findAll: jest.fn(),
         findById: jest.fn(),
         create: jest.fn(),
         update: jest.fn(),
         updateStatus: jest.fn(),
         remove: jest.fn(),
      } as unknown as jest.Mocked<TasksRepository>;

      service = new TasksService(repository);
   });

   // -------------------------------------------------------------------------
   describe('findAll', () => {
      it('delegates to repository and returns the full list', async () => {
         const tasks = [
            buildTaskWithContext(),
            buildTaskWithContext({
               id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
               title: 'Segunda tarefa',
            }),
         ];
         repository.findAll.mockResolvedValue(tasks);

         const result = await service.findAll();

         expect(repository.findAll).toHaveBeenCalledTimes(1);
         expect(result).toEqual(tasks);
      });
   });

   // -------------------------------------------------------------------------
   describe('findById', () => {
      it('returns the task when it exists', async () => {
         const task = buildTaskEntity();
         repository.findById.mockResolvedValue(task);

         const result = await service.findById(TASK_ID);

         expect(result).toEqual(task);
         expect(repository.findById).toHaveBeenCalledWith(TASK_ID);
      });

      it('throws NotFoundException when the task does not exist', async () => {
         repository.findById.mockResolvedValue(null);

         await expect(service.findById('nonexistent')).rejects.toBeInstanceOf(
            NotFoundException,
         );
      });
   });

   // -------------------------------------------------------------------------
   describe('create', () => {
      it('creates a task with default status "todo" when none is provided', async () => {
         const task = buildTaskEntity();
         repository.create.mockResolvedValue(task);

         await service.create({ title: 'Nova tarefa' }, USER_ID);

         expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
               title: 'Nova tarefa',
               status: 'todo',
               createdById: USER_ID,
            }),
         );
      });

      it('creates a task with the explicitly provided status', async () => {
         repository.create.mockResolvedValue(
            buildTaskEntity({ status: 'in_progress' }),
         );

         await service.create(
            { title: 'Em andamento', status: 'in_progress' },
            USER_ID,
         );

         expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'in_progress' }),
         );
      });

      it('passes description and processId through to the repository', async () => {
         const processId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
         repository.create.mockResolvedValue(
            buildTaskEntity({ description: 'Desc', processId }),
         );

         await service.create(
            { title: 'Com processo', description: 'Desc', processId },
            USER_ID,
         );

         expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
               description: 'Desc',
               processId,
               createdById: USER_ID,
            }),
         );
      });
   });

   // -------------------------------------------------------------------------
   describe('update', () => {
      it('throws NotFoundException when the task to update does not exist', async () => {
         repository.findById.mockResolvedValue(null);

         await expect(
            service.update('nonexistent', { title: 'Novo título' }, USER_ID),
         ).rejects.toBeInstanceOf(NotFoundException);

         expect(repository.update).not.toHaveBeenCalled();
      });

      it('throws NotFoundException when the repository update returns null', async () => {
         repository.findById.mockResolvedValue(buildTaskEntity());
         repository.update.mockResolvedValue(null);

         await expect(
            service.update(TASK_ID, { title: 'Novo título' }, USER_ID),
         ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('updates the task and returns the updated entity', async () => {
         const updated = buildTaskEntity({ title: 'Título atualizado' });
         repository.findById.mockResolvedValue(buildTaskEntity());
         repository.update.mockResolvedValue(updated);

         const result = await service.update(
            TASK_ID,
            { title: 'Título atualizado' },
            USER_ID,
         );

         expect(repository.update).toHaveBeenCalledWith(
            TASK_ID,
            expect.objectContaining({
               title: 'Título atualizado',
               updatedById: USER_ID,
            }),
         );
         expect(result).toEqual(updated);
      });
   });

   // -------------------------------------------------------------------------
   describe('updateStatus', () => {
      it('throws NotFoundException when the task does not exist', async () => {
         repository.findById.mockResolvedValue(null);

         await expect(
            service.updateStatus('nonexistent', { status: 'done' }, USER_ID),
         ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('throws NotFoundException when updateStatus returns null', async () => {
         repository.findById.mockResolvedValue(buildTaskEntity());
         repository.updateStatus.mockResolvedValue(null);

         await expect(
            service.updateStatus(TASK_ID, { status: 'done' }, USER_ID),
         ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('calls repository with the new status and userId, returns updated entity', async () => {
         const updated = buildTaskEntity({ status: 'done' });
         repository.findById.mockResolvedValue(
            buildTaskEntity({ status: 'todo' }),
         );
         repository.updateStatus.mockResolvedValue(updated);

         const result = await service.updateStatus(
            TASK_ID,
            { status: 'done' },
            USER_ID,
         );

         expect(repository.updateStatus).toHaveBeenCalledWith(
            TASK_ID,
            'done',
            USER_ID,
         );
         expect(result).toEqual(updated);
      });
   });

   // -------------------------------------------------------------------------
   describe('remove', () => {
      it('throws NotFoundException when the task does not exist', async () => {
         repository.findById.mockResolvedValue(null);

         await expect(service.remove('nonexistent')).rejects.toBeInstanceOf(
            NotFoundException,
         );
      });

      it('throws NotFoundException when the repository remove returns null', async () => {
         repository.findById.mockResolvedValue(buildTaskEntity());
         repository.remove.mockResolvedValue(null);

         await expect(service.remove(TASK_ID)).rejects.toBeInstanceOf(
            NotFoundException,
         );
      });

      it('removes the task and returns the deleted entity', async () => {
         const task = buildTaskEntity();
         repository.findById.mockResolvedValue(task);
         repository.remove.mockResolvedValue(task);

         const result = await service.remove(TASK_ID);

         expect(repository.remove).toHaveBeenCalledWith(TASK_ID);
         expect(result).toEqual(task);
      });
   });
});
