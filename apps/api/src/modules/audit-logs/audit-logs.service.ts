import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repository';
import type { AuditLogFiltersInput } from '../../schema/zod';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repository: AuditLogsRepository) {}

  async findMany(filters: AuditLogFiltersInput) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const result = await this.repository.findMany({ ...filters, page, pageSize });
    return {
      items: result.items,
      meta: { total: result.total, page: result.page, pageSize: result.pageSize },
    };
  }
}
