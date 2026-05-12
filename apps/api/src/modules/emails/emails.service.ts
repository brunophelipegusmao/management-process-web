import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailsRepository } from './emails.repository';
import type { EmailFiltersInput } from '../../schema/zod';

@Injectable()
export class EmailsService {
   constructor(private readonly repository: EmailsRepository) {}

   async findMany(filters: EmailFiltersInput) {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;
      const result = await this.repository.findMany({
         ...filters,
         page,
         pageSize,
      });
      return {
         items: result.items,
         meta: {
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
         },
      };
   }

   async findOne(id: string) {
      const email = await this.repository.findById(id);
      if (!email) throw new NotFoundException('Email não encontrado');
      return email;
   }
}
