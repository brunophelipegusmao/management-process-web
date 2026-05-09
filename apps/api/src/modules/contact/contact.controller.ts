import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from '../../common/pipes/create-zod-dto';
import { Public } from '../../common/decorators/public.decorator';
import { ContactService } from './contact.service';

const contactSchema = z.object({
  name:            z.string().trim().min(2),
  email:           z.string().trim().email(),
  phone:           z.string().trim().optional(),
  subject:         z.string().trim().min(1),
  message:         z.string().trim().min(10),
  recaptchaToken:  z.string().min(1),
});

class ContactDto extends createZodDto(contactSchema) {}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enviar mensagem de contato pelo site' })
  async send(@Body() body: ContactDto): Promise<void> {
    await this.contactService.send(body);
  }
}
