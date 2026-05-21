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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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

@ApiTags('Inquiries')
@ApiBearerAuth('access-token')
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly service: InquiriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '문의 작성' })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createInquirySchema)) dto: CreateInquiryDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 문의 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  findByUserId(@CurrentUser() user: JwtPayload) {
    return this.service.findByUserId(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '문의 단건 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'INQUIRY_NOT_FOUND' })
  findById(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findById(user.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '문의 수정' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 404, description: 'INQUIRY_NOT_FOUND' })
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
  @ApiOperation({ summary: '문의 삭제 (소프트 딜리트)' })
  @ApiResponse({ status: 204, description: '성공' })
  @ApiResponse({ status: 404, description: 'INQUIRY_NOT_FOUND' })
  softDelete(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.softDelete(user.id, id);
  }
}
