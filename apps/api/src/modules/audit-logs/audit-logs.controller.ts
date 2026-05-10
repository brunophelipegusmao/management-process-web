import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { createZodDto } from '../../common/pipes/create-zod-dto';
import { auditLogFiltersSchema, type AuditLogFiltersInput } from '../../schema/zod';
import { AuditLogsService } from './audit-logs.service';

class AuditLogFiltersQueryDto extends createZodDto(auditLogFiltersSchema) {}

@ApiTags('audit-logs')
@ApiBearerAuth()
@Roles('superadmin')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @ApiOperation({ summary: 'Lista logs de auditoria com filtros opcionais' })
  @ApiOkResponse({ description: 'Logs retornados com sucesso.' })
  @ApiUnauthorizedResponse({ description: 'Sessao ausente ou invalida.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito a superadmin.' })
  @Get()
  async findMany(@Query() query: AuditLogFiltersQueryDto) {
    const result = await this.auditLogsService.findMany(query as AuditLogFiltersInput);
    return { data: result.items, meta: result.meta };
  }
}
