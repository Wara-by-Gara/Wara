import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { answerInquirySchema, AnswerInquiryDto } from './dto/answer-inquiry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('admin/inquiries')
@UseGuards(JwtAuthGuard)
@AdminOnly()
export class AdminInquiriesController {
  constructor(private readonly service: InquiriesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseUlidPipe) id: string) {
    return this.service.findByIdForAdmin(id);
  }

  @Patch(':id/answer')
  @HttpCode(HttpStatus.OK)
  async answer(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(answerInquirySchema)) dto: AnswerInquiryDto,
  ) {
    return this.service.answer(user.id, id, dto);
  }
}
