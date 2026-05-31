import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeedbacksRepository } from './feedbacks.repository';
import { ErrorCode } from '../common/constants/error-codes';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { ListFeedbacksDto } from './dto/list-feedbacks.dto';
import { Participant } from '../database/schema';
import { S3Service } from '../s3/s3.service';
import { NotificationsService } from '../notifications/notifications.service';

const DELETED_PLACEHOLDER = '삭제된 댓글입니다.';

@Injectable()
export class FeedbacksService {
  constructor(
    private readonly repository: FeedbacksRepository,
    private readonly s3Service: S3Service,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveProfileImageUrl(url: string | null): Promise<string | null> {
    if (!url) return null;
    return this.s3Service.getViewPresignedUrl(url);
  }

  private async attachProfileImageUrls<
    T extends {
      participant: { user: { profileImageUrl: string | null } };
      replies?: Array<{ participant: { user: { profileImageUrl: string | null } } }>;
    },
  >(rows: T[]): Promise<T[]> {
    return Promise.all(
      rows.map(async (f) => ({
        ...f,
        participant: {
          ...f.participant,
          user: {
            ...f.participant.user,
            profileImageUrl: await this.resolveProfileImageUrl(f.participant.user.profileImageUrl),
          },
        },
        replies: f.replies
          ? await Promise.all(
              f.replies.map(async (r) => ({
                ...r,
                participant: {
                  ...r.participant,
                  user: {
                    ...r.participant.user,
                    profileImageUrl: await this.resolveProfileImageUrl(r.participant.user.profileImageUrl),
                  },
                },
              })),
            )
          : f.replies,
      })),
    );
  }

  // photo / attachedPhoto 필드에 presigned URL 주입 (replies 포함)
  private async attachPhotoUrls<
    T extends {
      photo?: { imageKey: string } | null;
      attachedPhoto?: { imageKey: string } | null;
      replies?: Array<{ attachedPhoto?: { imageKey: string } | null }>;
    },
  >(rows: T[]) {
    return Promise.all(
      rows.map(async (f) => {
        const photo = f.photo
          ? { ...f.photo, url: await this.s3Service.getViewPresignedUrl(f.photo.imageKey) }
          : f.photo;
        const attachedPhoto = f.attachedPhoto
          ? { ...f.attachedPhoto, url: await this.s3Service.getViewPresignedUrl(f.attachedPhoto.imageKey) }
          : f.attachedPhoto;
        const replies = f.replies
          ? await Promise.all(
              f.replies.map(async (r) => ({
                ...r,
                attachedPhoto: r.attachedPhoto
                  ? { ...r.attachedPhoto, url: await this.s3Service.getViewPresignedUrl(r.attachedPhoto.imageKey) }
                  : r.attachedPhoto,
              })),
            )
          : f.replies;
        return { ...f, photo, attachedPhoto, replies };
      }),
    );
  }

  //삭제된 댓글 내용 placeholder로 바꾸는 private 헬퍼 메소드
  private applyDeletedPlaceholder<
    T extends {
      deletedAt: Date | null;
      content: string;
      replies?: Array<{ deletedAt: Date | null; content: string }>;
    },
  >(feedbacks: T[]) {
    return feedbacks.map((f) => ({
      ...(f.deletedAt ? { ...f, content: DELETED_PLACEHOLDER } : f),
      replies: f.replies?.map((r) =>
        r.deletedAt ? { ...r, content: DELETED_PLACEHOLDER } : r,
      ),
    }));
  }

  // 초대장댓글 + 사진 댓글 혼합 (초대장 상세페이지에서 보여줄 댓글들...)
  async listAll(invitationId: string, dto: ListFeedbacksDto, participantId?: string) {
    const { rows, nextCursor } = await this.repository.findAllByInvitation(
      invitationId,
      dto,
      participantId,
    );
    return {
      rows: await this.attachPhotoUrls(await this.attachProfileImageUrls(this.applyDeletedPlaceholder(rows))),
      nextCursor,
    };
  }

  //사진 댓글 리스트
  async listByPhoto(
    invitationId: string,
    photoId: string,
    dto: ListFeedbacksDto,
    participantId?: string,
  ) {
    const photo = await this.repository.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    if (photo.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    const feedbacks = await this.repository.findAllByPhoto(photoId, dto, participantId);
    return {
      rows: await this.attachPhotoUrls(
        await this.attachProfileImageUrls(this.applyDeletedPlaceholder(feedbacks.rows)),
      ),
      nextCursor: feedbacks.nextCursor,
    };
  }

  //초대장 댓글 생성
  async createForInvitation(
    invitationId: string,
    participant: Participant,
    dto: CreateFeedbackDto,
  ) {
    if (dto.parentId) {
      const parent = await this.repository.findById(dto.parentId);
      if (!parent) throw new NotFoundException(ErrorCode.FEEDBACK_NOT_FOUND);
    }
    const feedback = await this.repository.create({
      participantId: participant.id,
      invitationId,
      content: dto.content,
      parentId: dto.parentId,
      attachedPhotoId: dto.attachedPhotoId,
    });

    if (feedback && dto.mentionedUserIds?.length) {
      const actorNickname = await this.repository.findUserNickname(participant.userId) ?? '누군가';
      await Promise.all(
        dto.mentionedUserIds.map((userId) =>
          this.notificationsService.notify({
            userId,
            actorUserId: participant.userId,
            type: 'mention',
            content: `${actorNickname}님이 댓글에서 회원님을 언급했습니다`,
            targetType: 'feedback',
            targetId: feedback.id,
          }),
        ),
      );
    }

    return feedback;
  }

  //사진 댓글 생성
  async createForPhoto(
    invitationId: string,
    photoId: string,
    participant: Participant,
    dto: CreateFeedbackDto,
  ) {

    if (dto.parentId) {
      const parent = await this.repository.findById(dto.parentId);
      if (!parent) throw new NotFoundException(ErrorCode.FEEDBACK_NOT_FOUND);
    }
    const photo = await this.repository.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    if (photo.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    const feedback = await this.repository.create({
      participantId: participant.id,
      invitationId,
      photoId,
      content: dto.content,
      parentId: dto.parentId,
    });

    if (feedback && dto.mentionedUserIds?.length) {
      const actorNickname = await this.repository.findUserNickname(participant.userId) ?? '누군가';
      await Promise.all(
        dto.mentionedUserIds.map((userId) =>
          this.notificationsService.notify({
            userId,
            actorUserId: participant.userId,
            type: 'mention',
            content: `${actorNickname}님이 댓글에서 회원님을 언급했습니다`,
            targetType: 'feedback',
            targetId: feedback.id,
          }),
        ),
      );
    }

    return feedback;
  }

  //본인 댓글인지 검증하는 헬퍼 메서드
  private async checkOwner(
  invitationId: string,
  feedbackId: string,
  userId: string,
) {
  const feedback = await this.repository.findById(feedbackId);
  if (!feedback) {
    throw new NotFoundException(ErrorCode.FEEDBACK_NOT_FOUND);
  }

  // 초대장 댓글: invitationId 직접 비교
  // 사진 댓글: photo의 invitationId로 비교
  const feedbackInvitationId =
    feedback.invitationId ?? feedback.participant.invitationId;

  if (feedbackInvitationId !== invitationId) {
    throw new NotFoundException(ErrorCode.FEEDBACK_NOT_FOUND);
  }

  if (feedback.participant.userId !== userId) {
    throw new ForbiddenException(ErrorCode.FEEDBACK_FORBIDDEN);
  }

  return feedback;
}
  //댓글 수정
  async update(
    invitationId: string,
    feedbackId: string,
    participant: Participant,
    dto: UpdateFeedbackDto,
  ) {
    await this.checkOwner(invitationId, feedbackId, participant.userId);
    return this.repository.update(feedbackId, dto.content);
  }

  //댓글 삭제
  async remove(invitationId: string, feedbackId: string, participant: Participant,) {
    await this.checkOwner(invitationId, feedbackId, participant.userId);
    await this.repository.softDelete(feedbackId);
  }

  //좋아요 토글
  async toggleLike(
    invitationId: string,
    feedbackId: string,
    participant: Participant,
  ) {
    const feedback = await this.repository.findById(feedbackId);
    if (!feedback) {
      throw new NotFoundException(ErrorCode.FEEDBACK_NOT_FOUND);
    }

    const existing = await this.repository.findLike(feedbackId, participant.id);

    if (existing) {
      await this.repository.deleteLike(feedbackId, participant.id);
      return { liked: false };
    } else {
      await this.repository.createLike(feedbackId, participant.id);
      return { liked: true };
    }
  }
}
