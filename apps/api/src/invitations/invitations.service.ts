import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InvitationsRepository } from './invitations.repository';
import { TemplatesRepository } from '../templates/templates.repository';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { ErrorCode } from '../common/constants/error-codes';
import { InvitationPresignedUrlDto } from './dto/invitation-presigned-url.dto';
import { ulid } from 'ulid';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly repository: InvitationsRepository,
    private readonly templatesRepository: TemplatesRepository,
    private readonly s3Service: S3Service,
  ) {}

  async generatePresignedUrl(dto: InvitationPresignedUrlDto) {
    const key = `public/invitations/${ulid()}/${dto.fileName}`;
    return this.s3Service.getUploadPresignedUrl(key, dto.contentType);
  }

  private toResponse(invitation: { mainImageKey: string | null; mainGifUrl: string | null; [key: string]: unknown }) {
    return {
      ...invitation,
      mainImageUrl: invitation.mainImageKey ? this.s3Service.getPublicUrl(invitation.mainImageKey) : null,
      mainGifUrl: invitation.mainGifUrl ?? null,
    };
  }

  async findAll(userId: string) {
    const invitations = await this.repository.findAllByUserId(userId);
    return invitations.map((invitation) => this.toResponse(invitation));
  }

  async findOne(id: string) {
    const invitation = await this.repository.findById(id);
    if (!invitation) {
      throw new NotFoundException({
        code: ErrorCode.INVITATION_NOT_FOUND,
        message: '초대장을 찾을 수 없습니다.',
      });
    }
    return this.toResponse(invitation);
  }

  private async validateTemplateId(templateId: string) {
    const template = await this.templatesRepository.findById(templateId);
    if (!template) {
      throw new NotFoundException({
        code: ErrorCode.TEMPLATE_NOT_FOUND,
        message: '템플릿을 찾을 수 없습니다.',
      });
    }
  }

  async create(userId: string, dto: CreateInvitationDto) {
    if (dto.templateId) {
      await this.validateTemplateId(dto.templateId);
    }
    const invitation = await this.repository.create(userId, dto);
    return this.toResponse(invitation);
  }

  async update(id: string, dto: UpdateInvitationDto) {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);

    if (dto.templateId && dto.templateId !== current.templateId) {
      await this.validateTemplateId(dto.templateId);
    }

    // 상호 배타: mainGifUrl 있으면 mainImageKey null로, mainImageKey 있으면 mainGifUrl null로
    const updated = await this.repository.update(id, {
      ...dto,
      mainImageKey: dto.mainGifUrl ? null : dto.mainImageKey,
      mainGifUrl: dto.mainImageKey ? null : dto.mainGifUrl,
    });
    if (!updated) throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);

    return this.toResponse(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    const guestCount = await this.repository.countGuests(id);
    if (guestCount > 0) {
      throw new ForbiddenException({
        code: ErrorCode.INVITATION_HAS_PARTICIPANTS,
        message: '참석자가 있는 초대장은 삭제할 수 없습니다.',
      });
    }
    return this.repository.remove(id);
  }
}