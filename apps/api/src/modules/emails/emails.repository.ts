import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '../../infra/database/client';
import { emails } from '../../schema';
import type { EmailFiltersInput } from '../../schema/zod';

export type EmailEntity = typeof emails.$inferSelect;

export type EmailListResult = {
   items: EmailEntity[];
   total: number;
   page: number;
   pageSize: number;
};

type NormalizedFilters = {
   processId?: string;
   template?: EmailEntity['template'];
   recipient?: string;
   page: number;
   pageSize: number;
};

@Injectable()
export class EmailsRepository {
   async findMany(filters: NormalizedFilters): Promise<EmailListResult> {
      const conditions = [
         filters.processId
            ? eq(emails.processId, filters.processId)
            : undefined,
         filters.template ? eq(emails.template, filters.template) : undefined,
         filters.recipient
            ? eq(emails.recipient, filters.recipient)
            : undefined,
      ].filter(c => c !== undefined);

      const whereClause =
         conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (filters.page - 1) * filters.pageSize;

      const [items, [{ total }]] = await Promise.all([
         db
            .select()
            .from(emails)
            .where(whereClause)
            .orderBy(desc(emails.sentAt))
            .limit(filters.pageSize)
            .offset(offset),
         db
            .select({ total: sql<number>`count(*)::int` })
            .from(emails)
            .where(whereClause),
      ]);

      return { items, total, page: filters.page, pageSize: filters.pageSize };
   }

   async findById(id: string): Promise<EmailEntity | undefined> {
      const [row] = await db.select().from(emails).where(eq(emails.id, id));
      return row;
   }
}
