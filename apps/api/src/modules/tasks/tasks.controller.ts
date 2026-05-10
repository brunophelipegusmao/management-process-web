import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { z } from 'zod';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { createZodDto } from '../../common/pipes/create-zod-dto';
import type { AuthenticatedUser } from '../../common/guards/auth.guard';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type UpdateTaskStatusInput,
} from '../../schema/zod';
import { TasksService } from './tasks.service';

const taskIdParamSchema = z.object({ id: z.string().uuid() });

class TaskIdParamDto extends createZodDto(taskIdParamSchema) {}
class CreateTaskBodyDto extends createZodDto(createTaskSchema) {}
class UpdateTaskBodyDto extends createZodDto(updateTaskSchema) {}
class UpdateTaskStatusBodyDto extends createZodDto(updateTaskStatusSchema) {}

@ApiTags('tasks')
@ApiBearerAuth()
@Roles('superadmin', 'advogado', 'paralegal')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Lista todas as tarefas com contexto de processo e usuários' })
  @ApiOkResponse({ description: 'Tarefas retornadas com sucesso.' })
  @ApiUnauthorizedResponse({ description: 'Sessao ausente ou invalida.' })
  @Get()
  async findAll() {
    return { data: await this.tasksService.findAll() };
  }

  @ApiOperation({ summary: 'Cria uma nova tarefa' })
  @ApiCreatedResponse({ description: 'Tarefa criada com sucesso.' })
  @ApiUnauthorizedResponse({ description: 'Sessao ausente ou invalida.' })
  @Post()
  async create(
    @Body() body: CreateTaskBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.create(body as CreateTaskInput, user.id);
  }

  @ApiOperation({ summary: 'Atualiza uma tarefa existente' })
  @ApiOkResponse({ description: 'Tarefa atualizada com sucesso.' })
  @ApiUnauthorizedResponse({ description: 'Sessao ausente ou invalida.' })
  @ApiNotFoundResponse({ description: 'Tarefa nao encontrada.' })
  @Patch(':id')
  async update(
    @Param() params: TaskIdParamDto,
    @Body() body: UpdateTaskBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.update(params.id, body as UpdateTaskInput, user.id);
  }

  @ApiOperation({ summary: 'Atualiza o status de uma tarefa (drag-and-drop)' })
  @ApiOkResponse({ description: 'Status atualizado com sucesso.' })
  @ApiUnauthorizedResponse({ description: 'Sessao ausente ou invalida.' })
  @ApiNotFoundResponse({ description: 'Tarefa nao encontrada.' })
  @Patch(':id/status')
  async updateStatus(
    @Param() params: TaskIdParamDto,
    @Body() body: UpdateTaskStatusBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.updateStatus(
      params.id,
      body as UpdateTaskStatusInput,
      user.id,
    );
  }

  @ApiOperation({ summary: 'Remove uma tarefa' })
  @ApiOkResponse({ description: 'Tarefa removida com sucesso.' })
  @ApiUnauthorizedResponse({ description: 'Sessao ausente ou invalida.' })
  @ApiNotFoundResponse({ description: 'Tarefa nao encontrada.' })
  @Delete(':id')
  async remove(@Param() params: TaskIdParamDto) {
    return this.tasksService.remove(params.id);
  }
}
