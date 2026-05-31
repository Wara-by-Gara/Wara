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
    const key = `public/invitations/mainImage/${ulid()}/${dto.fileName}`;
    return this.s3Service.getUploadPresignedUrl(key, dto.contentType);
  }

  private toResponse(invitation: {
    mainCoverType: string;
    mainImageKey: string | null;
    mainGifUrl: string | null;
    [key: string]: unknown;
  }) {
    return {
      ...invitation,
      mainImageUrl: invitation.mainImageKey
        ? this.s3Service.getPublicUrl(invitation.mainImageKey)
        : null,
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

    // GIF면 image 필드를 null, image면 gif 필드를 null로 명시 (XOR 보장)
    const isGif = !!dto.mainGifUrl;
    const invitation = await this.repository.create(userId, {
      ...dto,
      mainCoverType: isGif ? 'gif' : 'image',
      mainImageKey: isGif ? undefined : dto.mainImageKey,
      mainGifUrl: isGif ? dto.mainGifUrl : undefined,
    });
    return this.toResponse(invitation);
  }

  async update(id: string, dto: UpdateInvitationDto) {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);

    if (dto.templateId && dto.templateId !== current.templateId) {
      await this.validateTemplateId(dto.templateId);
    }

    // 커버 입력(GIF/이미지)이 있을 때만 커버 관련 필드를 변경.
    // 둘 다 없으면 coverPatch는 비어서 기존 커버를 그대로 유지.
    // coverPatch가 dto 뒤에 펼쳐지므로 dto의 원본 커버 필드를 덮어씀.
    const coverPatch: {
      mainCoverType?: 'image' | 'gif';
      mainImageKey?: string | null;
      mainGifUrl?: string | null;
    } = {};

    if (dto.mainGifUrl) {
      coverPatch.mainCoverType = 'gif';
      coverPatch.mainGifUrl = dto.mainGifUrl;
      coverPatch.mainImageKey = null;
    } else if (dto.mainImageKey) {
      coverPatch.mainCoverType = 'image';
      coverPatch.mainImageKey = dto.mainImageKey;
      coverPatch.mainGifUrl = null;
    }

    const updated = await this.repository.update(id, { ...dto, ...coverPatch });
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