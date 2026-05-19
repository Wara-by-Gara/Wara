import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InquiriesRepository } from './inquiries.repository';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { AnswerInquiryDto } from './dto/answer-inquiry.dto';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class InquiriesService {
  constructor(private readonly repository: InquiriesRepository) {}

  async create(userId: string, dto: CreateInquiryDto) {
    return this.repository.create(userId, {
      inquiryType: dto.inquiryType,
      title: dto.title,
      content: dto.content,
    });
  }

  async findById(userId: string, inquiryId: string) {
    const inquiry = await this.repository.findById(inquiryId);
    if (!inquiry) {
      throw new NotFoundException({
        code: ErrorCode.INQUIRY_NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      });
    }
    if (inquiry.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.INQUIRY_NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      });
    }
    return inquiry;
  }

  async findByUserId(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async update(userId: string, inquiryId: string, dto: UpdateInquiryDto) {
    const inquiry = await this.repository.findById(inquiryId);
    if (!inquiry) {
      throw new NotFoundException({
        code: ErrorCode.INQUIRY_NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      });
    }
    if (inquiry.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.INQUIRY_NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      });
    }
    if (inquiry.status !== 'pending') {
      throw new ConflictException('답변 중이거나 완료된 문의는 수정할 수 없습니다.');
    }
    return this.repository.update(inquiryId, dto);
  }

  async softDelete(userId: string, inquiryId: string) {
    const inquiry = await this.repository.findById(inquiryId);
    if (!inquiry) {
      throw new NotFoundException({
        code: ErrorCode.INQUIRY_NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      });
    }
    if (inquiry.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.INQUIRY_NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      });
    }
    await this.repository.softDelete(inquiryId);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findByIdForAdmin(inquiryId: string) {
    const inquiry = await this.repository.findById(inquiryId);
    if (!inquiry) {
      throw new NotFoundException({
        code: ErrorCode.INQUIRY_NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      });
    }
    return inquiry;
  }

  async answer(adminId: string, inquiryId: string, dto: AnswerInquiryDto) {
    const inquiry = await this.repository.findById(inquiryId);
    if (!inquiry) {
      throw new NotFoundException({
        code: ErrorCode.INQUIRY_NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      });
    }
    return this.repository.answer(inquiryId, adminId, { answer: dto.answer, status: dto.status });
  }
}
