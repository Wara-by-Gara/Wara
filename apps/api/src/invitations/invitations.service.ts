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
import { ApplyAiImageDto } from './dto/apply-ai-image.dto';
import { ErrorCode } from '../common/constants/error-codes';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getObject } from '../common/utils/s3.util';
import { InvitationPresignedUrlDto } from './dto/invitation-presigned-url.dto';
import { ulid } from 'ulid';
import { S3_CLIENT } from '../s3/s3.module';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';

@Injectable()
export class InvitationsService {
  private readonly bucket: string;

  constructor(
    private readonly repository: InvitationsRepository,
    private readonly templatesRepository: TemplatesRepository,
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly config: ConfigService,
    private readonly aiService: AiService,
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
    const [mainImageUrl, templatePreviewUrl] = await Promise.all([
      this.getViewUrl(invitation.mainImageKey),
      invitation.templateId
        ? this.templatesRepository
            .findById(invitation.templateId)
            .then((t) => (t ? this.getViewUrl(t.previewImageKey) : null))
        : Promise.resolve(null),
    ]);
    return { ...invitation, mainImageUrl, templatePreviewUrl };
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

  /**
   * 사용자 업로드 사진 + 초대장 템플릿 이미지를 AI로 합성
   * 결과를 S3에 업로드하고 key와 presigned view URL을 반환
   */
  async applyAiToMainImage(invitationId: string, dto: ApplyAiImageDto) {
    const invitation = await this.repository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException({
        code: ErrorCode.INVITATION_NOT_FOUND,
        message: '초대장을 찾을 수 없습니다.',
      });
    }

    if (!invitation.templateId) {
      throw new NotFoundException({
        code: ErrorCode.AI_TEMPLATE_NOT_FOUND,
        message: 'AI 합성을 위한 템플릿이 설정되지 않았습니다.',
      });
    }

    const template = await this.templatesRepository.findById(invitation.templateId);
    if (!template) {
      throw new NotFoundException({
        code: ErrorCode.AI_TEMPLATE_NOT_FOUND,
        message: '템플릿을 찾을 수 없습니다.',
      });
    }

    const [userBuffer, templateBuffer] = await Promise.all([
      getObject(this.s3, this.bucket, dto.imageKey),
      getObject(this.s3, this.bucket, template.previewImageKey),
    ]);

    const prompt =
      '왼쪽 이미지의 인물을 오른쪽 이미지의 초대장 배경 디자인에 자연스럽게 합성해 주세요. ' +
      '배경 디자인과 분위기를 최대한 유지하면서 인물을 배경에 어울리게 배치해 주세요.';

    const resultBuffer = await this.aiService.compositeImages(
      userBuffer,
      templateBuffer,
      prompt,
    );

    const aiKey = `invitation-images/${invitationId}/ai/${ulid()}.png`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: aiKey,
        Body: resultBuffer,
        ContentType: 'image/png',
      }),
    );

    const url = await this.getViewUrl(aiKey);
    return { key: aiKey, url };
  }
}
