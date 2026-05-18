import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateTemplateDto, CreateTemplateSchema } from './dto/create-template.dto';
import { UpdateTemplateDto, UpdateTemplateSchema } from './dto/update-template.dto';

@Controller('invitation/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Public()
  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUlidPipe) id: string) {
    return this.templatesService.findOne(id);
  }

  @AdminOnly()
  @Post()
  create(@Body(new ZodValidationPipe(CreateTemplateSchema)) dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @AdminOnly()
  @Patch(':id')
  update(
    @Param('id', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(UpdateTemplateSchema)) dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, dto);
  }

  @AdminOnly()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUlidPipe) id: string) {
    return this.templatesService.remove(id);
  }
}
