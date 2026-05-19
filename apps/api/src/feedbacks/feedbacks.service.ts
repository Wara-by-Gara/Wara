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

const DELETED_PLACEHOLDER = '삭제된 댓글입니다.';

@Injectable()
export class FeedbacksService {
  constructor(private readonly repository: FeedbacksRepository) {}

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
  async listAll(invitationId: string, dto: ListFeedbacksDto) {
    const { rows, nextCursor } = await this.repository.findAllByInvitation(
      invitationId,
      dto,
    );
    return {
      rows: this.applyDeletedPlaceholder(rows),
      nextCursor,
    };
  }

  //사진 댓글 리스트
  async listByPhoto(
    invitationId: string,
    photoId: string,
    dto: ListFeedbacksDto,
  ) {
    const photo = await this.repository.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    if (photo.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    const feedbacks = await this.repository.findManyByPhoto(photoId, dto);
    return {
      rows: this.applyDeletedPlaceholder(feedbacks.rows),
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
    return this.repository.create({
      participantId: participant.id,
      invitationId,
      content: dto.content,
      parentId: dto.parentId,
    });
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

    return this.repository.create({
      participantId: participant.id,
      invitationId,
      photoId,
      content: dto.content,
      parentId: dto.parentId,
    });
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
