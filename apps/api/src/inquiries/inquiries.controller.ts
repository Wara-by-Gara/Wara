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
import { InquiriesService } from './inquiries.service';
import {
  createInquirySchema,
  CreateInquiryDto,
} from './dto/create-inquiry.dto';
import {
  updateInquirySchema,
  UpdateInquiryDto,
} from './dto/update-inquiry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly service: InquiriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createInquirySchema)) dto: CreateInquiryDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findByUserId(@CurrentUser() user: JwtPayload) {
    return this.service.findByUserId(user.id);
  }

  @Get('public')
  @UseGuards(JwtAuthGuard)
  findAllPublic() {
    return this.service.findAllPublic();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findById(user.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateInquirySchema)) dto: UpdateInquiryDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.softDelete(user.id, id);
  }
}
