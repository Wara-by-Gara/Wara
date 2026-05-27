import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
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
import { Public } from '../common/decorators/public.decorator';
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

  @Public()
  @Get('public')
  findAllPublic() {
    return this.service.findAllPublic();
  }

  @Public()
  @Get(':id')
  findById(
    @Param('id', ParseUlidPipe) id: string,
    @Req() req: Request,
  ) {
    const user = (req as Request & { user?: JwtPayload }).user;
    return this.service.findById(id, user);
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
