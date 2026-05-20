import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InvitationsRepository } from './invitations.repository';
import { TemplatesRepository } from '../templates/templates.repository';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { ErrorCode } from '../common/constants/error-codes';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InvitationPresignedUrlDto } from './dto/invitation-presigned-url.dto';
import { ulid } from 'ulid';
import { S3_CLIENT } from '../s3/s3.module';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvitationsService {
  private readonly bucket: string;

  constructor(
    private readonly repository: InvitationsRepository,
    private readonly templatesRepository: TemplatesRepository,
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow('AWS_S3_BUCKET');
  }

  //view Url(24시간)
  private async getViewUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: 86400 });
  }

  //Upload Url 발급
  async generatePresignedUrl(dto: InvitationPresignedUrlDto) {
    const key = `invitation-images/${ulid()}/${dto.fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });
    const presignedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 900,
    });
    return { presignedUrl, key };
  }

  async findAll(userId: string) {
    const invitations = await this.repository.findAllByUserId(userId);
    return Promise.all(
      invitations.map(async (invitation) => ({
        ...invitation,
        mainImageUrl: await this.getViewUrl(invitation.mainImageKey),
      })),
    );
  }

  async findOne(id: string) {
    const invitation = await this.repository.findById(id);
    if (!invitation) {
      throw new NotFoundException({
        code: ErrorCode.INVITATION_NOT_FOUND,
        message: '초대장을 찾을 수 없습니다.',
      });
    }
    const mainImageUrl = await this.getViewUrl(invitation.mainImageKey);
    return { ...invitation, mainImageUrl };
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
    const mainImageUrl = await this.getViewUrl(invitation.mainImageKey);
    return { ...invitation, mainImageUrl };
  }

  async update(id: string, dto: UpdateInvitationDto) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
    }
    if (dto.templateId && dto.templateId !== current.templateId) {
      await this.validateTemplateId(dto.templateId);
    }

    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
    }

    const mainImageUrl = await this.getViewUrl(updated.mainImageKey);
    return { ...updated, mainImageUrl };
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
