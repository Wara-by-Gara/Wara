import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
  Inject,
  GatewayTimeoutException,
  Logger,
} from '@nestjs/common';
import { InvitationsRepository } from './invitations.repository';
import { AiImageJobsRepository } from './ai-image-jobs.repository';
import { TemplatesRepository } from '../templates/templates.repository';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { ApplyAiImageDto } from './dto/apply-ai-image.dto';
import { ErrorCode } from '../common/constants/error-codes';
import { InvitationPresignedUrlDto } from './dto/invitation-presigned-url.dto';
import { ListPublicInvitationsDto } from './dto/list-public-invitations.dto';
import { ulid } from 'ulid';
import { S3Service } from '../s3/s3.service';
import { S3_CLIENT } from '../s3/s3.constants';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getObject } from '../common/utils/s3.util';
import { AiService } from '../ai/ai.service';
import { AiMonitoringService } from '../ai/ai-monitoring.service';
import { NotificationsService } from '../notifications/notifications.service';

const MAX_AI_RESULT_BYTES = 10 * 1024 * 1024; // 10MB
const AI_DAILY_LIMIT = 3;
/** public/ 접두사: S3 버킷의 public-read 경로 */
const PUBLIC_PREFIX = 'public/invitations/';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  private readonly bucket: string;
  /** 템플릿 이미지 인메모리 캐시 (key: templateId) */
  private readonly templateCache = new Map<string, Buffer>();

  constructor(
    private readonly repository: InvitationsRepository,
    private readonly aiJobsRepository: AiImageJobsRepository,
    private readonly templatesRepository: TemplatesRepository,
    private readonly s3Service: S3Service,
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly config: ConfigService,
    private readonly aiService: AiService,
    private readonly aiMonitoringService: AiMonitoringService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.bucket = this.config.getOrThrow('AWS_S3_BUCKET');
  }

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

  private async resolveProfileImageUrl(
    key: string | null,
  ): Promise<string | null> {
    if (!key) return null;
    return this.s3Service.getViewPresignedUrl(key);
  }

  async findAll(userId: string) {
    const invitations = await this.repository.findAllByUserId(userId);
    const invitationIds = invitations.map((inv) => inv.id);
    const previewMap =
      await this.repository.findParticipantPreviewsByInvitationIds(invitationIds);

    return Promise.all(
      invitations.map(async (invitation) => {
        const bundle = previewMap.get(invitation.id);
        const participantAvatars = bundle
          ? await Promise.all(
              bundle.previews.map(async (p) => ({
                id: p.userId,
                name: p.name,
                avatarUrl: await this.resolveProfileImageUrl(p.profileImageUrl),
                isHost: p.memberRole === 'HOST',
              })),
            )
          : [];

        return {
          ...this.toResponse(invitation),
          participantAvatars,
          participantTotal: bundle?.total ?? 0,
        };
      }),
    );
  }

  async findPublicExplore(dto: ListPublicInvitationsDto) {
    const { rows, nextCursor } = await this.repository.findPublicExplore(dto);
    const countMap = await this.repository.countPublicParticipantsByInvitationIds(
      rows.map((inv) => inv.id),
    );
    const items = rows.map((inv) => ({
      id: inv.id,
      title: inv.title,
      description: inv.description,
      category: inv.category,
      eventStartAt: inv.eventStartAt,
      mainImageUrl: inv.mainImageKey
        ? this.s3Service.getPublicUrl(inv.mainImageKey)
        : null,
      location: inv.eventLocation?.placeName ?? inv.eventLocation?.address ?? null,
      participantCount: countMap.get(inv.id) ?? 0,
      host: inv.host,
    }));
    return {
      items,
      nextCursor,
      hasNext: nextCursor !== null,
    };
  }

  async findOne(id: string) {
    const invitation = await this.repository.findById(id);
    if (!invitation) {
      throw new NotFoundException({
        code: ErrorCode.INVITATION_NOT_FOUND,
        message: '초대장을 찾을 수 없습니다.',
      });
    }
    const dateVotePollStatus = await this.repository.findDateVotePollStatus(id);
    return {
      ...this.toResponse(invitation),
      dateVotePollStatus,
    };
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
    const invitation = await this.repository.findById(id);
    if (!invitation) throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
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
   * AI 합성 잡을 생성하고 백그라운드에서 처리.
   * 즉시 { jobId }를 반환하며, 완료 시 WebSocket 알림 전송.
   */
  async applyAiToMainImage(
    invitationId: string,
    dto: ApplyAiImageDto,
    userId: string,
  ) {
    // 허용된 S3 경로만 처리 (path traversal 방지)
    if (!dto.imageKey.startsWith(PUBLIC_PREFIX)) {
      throw new ForbiddenException(ErrorCode.INSUFFICIENT_ROLE);
    }

    // 서킷 브레이커
    if (this.aiMonitoringService.isCircuitOpen) {
      throw new ServiceUnavailableException(ErrorCode.AI_SERVICE_UNAVAILABLE);
    }

    // 하루 3회 제한
    const todayCount = await this.aiJobsRepository.countTodayByUser(userId);
    if (todayCount >= AI_DAILY_LIMIT) {
      throw new HttpException(ErrorCode.AI_DAILY_LIMIT_EXCEEDED, HttpStatus.TOO_MANY_REQUESTS);
    }

    // 초대장 유효성 검사
    const invitation = await this.repository.findById(invitationId);
    if (!invitation) throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
    if (!invitation.templateId) throw new NotFoundException(ErrorCode.AI_TEMPLATE_NOT_FOUND);

    // 잡 생성
    const job = await this.aiJobsRepository.create({
      userId,
      invitationId,
      uploadedImageKey: dto.imageKey,
    });

    // 백그라운드 처리 (응답 후 실행)
    setImmediate(() => {
      void this.processAiJobAsync(
        job.id,
        invitationId,
        userId,
        dto.imageKey,
        invitation.templateId!,
      );
    });

    return { jobId: job.id };
  }

  /** AI 잡 상태 조회 */
  async getAiJobStatus(invitationId: string, jobId: string) {
    const job = await this.aiJobsRepository.findById(jobId);
    if (!job || job.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
    }

    const resultUrl =
      job.resultKey && job.status === 'completed'
        ? this.s3Service.getPublicUrl(job.resultKey)
        : null;

    return {
      id: job.id,
      status: job.status,
      resultKey: job.resultKey ?? null,
      resultUrl,
      errorCode: job.errorCode ?? null,
      createdAt: job.createdAt,
      completedAt: job.completedAt ?? null,
    };
  }

  /** 백그라운드 AI 처리 — setImmediate로 호출됨 */
  private async processAiJobAsync(
    jobId: string,
    invitationId: string,
    userId: string,
    uploadedImageKey: string,
    templateId: string,
  ): Promise<void> {
    try {
      await this.aiJobsRepository.updateStatus(jobId, 'processing');

      // 템플릿 버퍼 (캐시 우선)
      const template = await this.templatesRepository.findById(templateId);
      if (!template) {
        await this.aiJobsRepository.updateStatus(jobId, 'failed', {
          errorCode: ErrorCode.AI_TEMPLATE_NOT_FOUND,
        });
        await this.sendAiNotification(userId, invitationId, jobId, null, null);
        return;
      }

      let templateBuffer = this.templateCache.get(template.id);
      if (!templateBuffer) {
        templateBuffer = await getObject(this.s3, this.bucket, template.previewImageKey);
        this.templateCache.set(template.id, templateBuffer);
      }

      const userBuffer = await getObject(this.s3, this.bucket, uploadedImageKey);

      const DEFAULT_PROMPT =
        '왼쪽 이미지의 인물을 오른쪽 이미지의 초대장 배경 디자인에 자연스럽게 합성해 주세요. ' +
        '배경 디자인과 분위기를 최대한 유지하면서 인물을 배경에 어울리게 배치해 주세요.';
      const prompt = template.prompt ?? DEFAULT_PROMPT;

      const userMime = uploadedImageKey.endsWith('.webp') ? 'image/webp' : 'image/png';
      const resultBuffer = await this.aiService.compositeImages(
        userBuffer,
        templateBuffer,
        prompt,
        userMime,
      );

      if (resultBuffer.length > MAX_AI_RESULT_BYTES) {
        await this.aiJobsRepository.updateStatus(jobId, 'failed', {
          errorCode: ErrorCode.AI_PROCESSING_FAILED,
        });
        await this.sendAiNotification(userId, invitationId, jobId, null, null);
        return;
      }

      const aiKey = `${PUBLIC_PREFIX}${invitationId}/ai/${ulid()}.png`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: aiKey,
          Body: resultBuffer,
          ContentType: 'image/png',
        }),
      );

      const url = this.s3Service.getPublicUrl(aiKey);
      await this.aiJobsRepository.updateStatus(jobId, 'completed', { resultKey: aiKey });
      await this.sendAiNotification(userId, invitationId, jobId, aiKey, url);
    } catch (err) {
      const errorCode =
        err instanceof GatewayTimeoutException
          ? ErrorCode.AI_TIMEOUT
          : ErrorCode.AI_PROCESSING_FAILED;

      await this.aiJobsRepository
        .updateStatus(jobId, 'failed', { errorCode })
        .catch((e) => this.logger.error('잡 상태 실패 업데이트 오류', e));

      await this.sendAiNotification(userId, invitationId, jobId, null, null).catch(
        (e) => this.logger.error('AI 실패 알림 전송 오류', e),
      );
    }
  }

  private async sendAiNotification(
    userId: string,
    invitationId: string,
    jobId: string,
    resultKey: string | null,
    resultUrl: string | null,
  ): Promise<void> {
    const content = JSON.stringify({
      jobId,
      invitationId,
      key: resultKey,
      url: resultUrl,
      success: !!resultKey,
    });
    await this.notificationsService.notify({
      userId,
      type: 'ai_complete',
      content,
      targetType: 'invitation',
      targetId: invitationId,
      invitationId,
    });
  }
}
