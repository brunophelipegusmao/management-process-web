import { Module } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailsRepository } from './emails.repository';

@Module({
   controllers: [EmailsController],
   providers: [EmailsService, EmailsRepository],
})
export class EmailsModule {}
