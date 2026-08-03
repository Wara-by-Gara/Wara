import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InquiriesRepository } from './inquiries.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { AnswerInquiryDto } from './dto/answer-inquiry.dto';
import { ErrorCode } from '../common/constants/error-codes';
import { UserRole } from '../common/enums/role.enum';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Injectable()
export class InquiriesService {
  constructor(
    private readonly repository: InquiriesRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateInquiryDto) {
    return this.repository.create(userId, {
      inquiryType: dto.inquiryType,
      title: dto.title,
      content: dto.content,
      isPublic: dto.isPublic,
    });
  }

  async findById(inquiryId: string, requester?: JwtPayload) {
    const inquiry = await this.repository.findById(inquiryId);
    if (!inquiry) {
      throw new NotFoundException({
        code: ErrorCode.INQUIRY_NOT_FOUND,
        message: '문의를 찾을 수 없습니다.',
      });
    }

    if (!inquiry.isPublic) {
      const isOwner = requester?.id === inquiry.userId;
      const isAdmin = requester?.role === UserRole.ADMIN;
      if (!isOwner && !isAdmin) {
        return {
          ...inquiry,
          title: '비공개 문의입니다',
          content: '작성자만 열람할 수 있는 문의입니다.',
          answer: null,
          answeredAt: null,
          isPrivate: true,
        };
      }
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
        code: ErrorCode.INQUIRY_FORBIDDEN,
        message: ErrorCode.INQUIRY_FORBIDDEN,
      });
    }
    if (inquiry.status !== 'pending') {
      throw new ConflictException({
        code: ErrorCode.INQUIRY_NOT_EDITABLE,
        message: ErrorCode.INQUIRY_NOT_EDITABLE,
      });
    }
    return this.repository.update(inquiryId, {
      title: dto.title,
      content: dto.content,
      isPublic: dto.isPublic,
    });
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
        code: ErrorCode.INQUIRY_FORBIDDEN,
        message: ErrorCode.INQUIRY_FORBIDDEN,
      });
    }
    await this.repository.softDelete(inquiryId);
  }

  async findAll() {
    const { items } = await this.repository.findAll();
    return items;
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
    const result = await this.repository.answer(inquiryId, adminId, { answer: dto.answer, status: dto.status });
    void this.notificationsService.notify({
      userId: inquiry.userId,
      actorUserId: adminId,
      type: 'inquiry_answer',
      content: '문의하신 내용에 답변이 등록됐어요.',
    });
    return result;
  }

  async findAllPublic() {
    return this.repository.findAllPublic();
  }
}
