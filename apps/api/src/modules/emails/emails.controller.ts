import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
   ApiBearerAuth,
   ApiForbiddenResponse,
   ApiNotFoundResponse,
   ApiOkResponse,
   ApiOperation,
   ApiTags,
   ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { createZodDto } from '../../common/pipes/create-zod-dto';
import { emailFiltersSchema, type EmailFiltersInput } from '../../schema/zod';
import { EmailsService } from './emails.service';

class EmailFiltersQueryDto extends createZodDto(emailFiltersSchema) {}

@ApiTags('emails')
@ApiBearerAuth()
@Roles('superadmin')
@Controller('emails')
export class EmailsController {
   constructor(private readonly emailsService: EmailsService) {}

   @ApiOperation({
      summary: 'Lista histórico de e-mails com filtros opcionais',
   })
   @ApiOkResponse({ description: 'Emails retornados com sucesso.' })
   @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
   @ApiForbiddenResponse({ description: 'Acesso restrito a superadmin.' })
   @Get()
   async findMany(@Query() query: EmailFiltersQueryDto) {
      const result = await this.emailsService.findMany(
         query as EmailFiltersInput,
      );
      return { data: result.items, meta: result.meta };
   }

   @ApiOperation({ summary: 'Retorna um e-mail pelo ID' })
   @ApiOkResponse({ description: 'Email retornado com sucesso.' })
   @ApiNotFoundResponse({ description: 'Email não encontrado.' })
   @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
   @ApiForbiddenResponse({ description: 'Acesso restrito a superadmin.' })
   @Get(':id')
   async findOne(@Param('id', ParseUUIDPipe) id: string) {
      const email = await this.emailsService.findOne(id);
      return { data: email };
   }
}
