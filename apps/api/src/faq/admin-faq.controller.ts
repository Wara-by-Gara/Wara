import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FaqService } from './faq.service';
import { createFaqSchema, CreateFaqDto } from './dto/create-faq.dto';
import { updateFaqSchema, UpdateFaqDto } from './dto/update-faq.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('admin/faq')
@UseGuards(JwtAuthGuard)
@AdminOnly()
export class AdminFaqController {
  constructor(private readonly service: FaqService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createFaqSchema)) dto: CreateFaqDto,
  ) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(updateFaqSchema)) dto: UpdateFaqDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUlidPipe) id: string) {
    return this.service.remove(id);
  }
}
