import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { db } from '../../infra/database/client';
import { auditLogs } from '../../schema';
import type { AuditLogFiltersInput } from '../../schema/zod';

export type AuditLogEntity = typeof auditLogs.$inferSelect;

export type AuditLogListResult = {
  items: AuditLogEntity[];
  total: number;
  page: number;
  pageSize: number;
};

type NormalizedFilters = {
  processId?: string;
  userId?: string;
  actionType?: AuditLogEntity['actionType'];
  createdFrom?: Date;
  createdTo?: Date;
  page: number;
  pageSize: number;
};

@Injectable()
export class AuditLogsRepository {
  async findMany(filters: NormalizedFilters): Promise<AuditLogListResult> {
    const conditions = [
      filters.processId ? eq(auditLogs.processId, filters.processId) : undefined,
      filters.userId ? eq(auditLogs.userId, filters.userId) : undefined,
      filters.actionType ? eq(auditLogs.actionType, filters.actionType) : undefined,
      filters.createdFrom ? gte(auditLogs.createdAt, filters.createdFrom) : undefined,
      filters.createdTo ? lte(auditLogs.createdAt, filters.createdTo) : undefined,
    ].filter((c) => c !== undefined);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (filters.page - 1) * filters.pageSize;

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(filters.pageSize)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(whereClause),
    ]);

    return { items, total, page: filters.page, pageSize: filters.pageSize };
  }
}
