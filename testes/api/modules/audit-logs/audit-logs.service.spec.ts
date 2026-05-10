import { AuditLogsService } from '../../../../apps/api/src/modules/audit-logs/audit-logs.service';
import type { AuditLogsRepository } from '../../../../apps/api/src/modules/audit-logs/audit-logs.repository';
import type { AuditLog } from '../../../../apps/api/src/schema';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function buildAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
   return {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      processId: '11111111-1111-4111-8111-111111111111',
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      createdAt: new Date('2026-01-15T10:00:00Z'),
      actionType: 'CREATE_PROCESS',
      description: 'Processo criado',
      previousData: null,
      newData: { cnjNumber: '0001234-56.2026.8.26.0001' },
      ...overrides,
   };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuditLogsService', () => {
   let service: AuditLogsService;
   let repository: jest.Mocked<AuditLogsRepository>;

   beforeEach(() => {
      repository = {
         findMany: jest.fn(),
      } as unknown as jest.Mocked<AuditLogsRepository>;

      service = new AuditLogsService(repository);
   });

   // -------------------------------------------------------------------------
   describe('findMany — pagination defaults', () => {
      it('uses page=1 and pageSize=20 when filters are empty', async () => {
         repository.findMany.mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
         });

         await service.findMany({});

         expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ page: 1, pageSize: 20 }),
         );
      });

      it('respects explicitly provided page and pageSize', async () => {
         repository.findMany.mockResolvedValue({
            items: [],
            total: 0,
            page: 3,
            pageSize: 10,
         });

         await service.findMany({ page: 3, pageSize: 10 });

         expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ page: 3, pageSize: 10 }),
         );
      });
   });

   // -------------------------------------------------------------------------
   describe('findMany — envelope response', () => {
      it('wraps repository result in { items, meta } envelope', async () => {
         const log = buildAuditLog();
         repository.findMany.mockResolvedValue({
            items: [log],
            total: 42,
            page: 1,
            pageSize: 20,
         });

         const result = await service.findMany({});

         expect(result.items).toEqual([log]);
         expect(result.meta).toEqual({ total: 42, page: 1, pageSize: 20 });
      });

      it('returns empty items with correct meta when there are no records', async () => {
         repository.findMany.mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
         });

         const result = await service.findMany({});

         expect(result.items).toHaveLength(0);
         expect(result.meta.total).toBe(0);
      });
   });

   // -------------------------------------------------------------------------
   describe('findMany — filter forwarding', () => {
      it('forwards userId filter to the repository', async () => {
         const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
         repository.findMany.mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
         });

         await service.findMany({ userId });

         expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ userId }),
         );
      });

      it('forwards processId filter to the repository', async () => {
         const processId = '11111111-1111-4111-8111-111111111111';
         repository.findMany.mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
         });

         await service.findMany({ processId });

         expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ processId }),
         );
      });

      it('forwards actionType filter to the repository', async () => {
         repository.findMany.mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
         });

         await service.findMany({ actionType: 'CREATE_PROCESS' });

         expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ actionType: 'CREATE_PROCESS' }),
         );
      });

      it('forwards date-range filters (createdFrom, createdTo) to the repository', async () => {
         const createdFrom = new Date('2026-01-01');
         const createdTo = new Date('2026-01-31');
         repository.findMany.mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
         });

         await service.findMany({ createdFrom, createdTo });

         expect(repository.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ createdFrom, createdTo }),
         );
      });
   });
});
