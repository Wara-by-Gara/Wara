import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeedbacksRepository } from './feedbacks.repository';
import { ErrorCode } from '../common/constants/error-codes';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

const DELETED_PLACEHOLDER = '삭제된 댓글입니다.';

@Injectable()
export class FeedbacksService {
  constructor(private readonly repository: FeedbacksRepository) {}

  //삭제된 댓글 내용 placeholder로 바꾸는 private 헬퍼 메소드
  private applyDeletedPlaceholder<
    T extends { deletedAt: Date | null; content: string },
  >(feedbacks: T[]) {
    return feedbacks.map((f) =>
      f.deletedAt ? { ...f, content: DELETED_PLACEHOLDER } : f,
    );
  }

  //초대장 댓글 리스트
  async listByInvitation(
    invitationId: string,
    userId: string,
  ) {
    const participant = await this.repository.findParticipant(
      userId,
      invitationId,
    );
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    const feedbacks = await this.repository.findManyByInvitation(
      invitationId,
    );
    return this.applyDeletedPlaceholder(feedbacks);
  }

  //사진 댓글 리스트
  async listByPhoto(
    invitationId: string,
    photoId: string,
    userId: string,
  ) {
    const participant = await this.repository.findParticipant(
      userId,
      invitationId,
    );
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }

    const photo = await this.repository.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    if (photo.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    const feedbacks = await this.repository.findManyByPhoto(photoId);
    return this.applyDeletedPlaceholder(feedbacks);
  }

  //초대장 댓글 생성
  async createForInvitation(
    invitationId: string,
    userId: string,
    dto: CreateFeedbackDto,
  ) {
    const participant = await this.repository.findParticipant(
      userId,
      invitationId,
    );
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
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
    userId: string,
    dto: CreateFeedbackDto,
  ) {
    const participant = await this.repository.findParticipant(
      userId,
      invitationId,
    );
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
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
  private async checkOwner(feedbackId: string, userId: string) {
    const feedback = await this.repository.findById(feedbackId);
    if (!feedback) {
      throw new NotFoundException(ErrorCode.FEEDBACK_NOT_FOUND);
    }
    if (feedback.participant.userId !== userId) {
      throw new ForbiddenException(ErrorCode.FEEDBACK_FORBIDDEN);
    }
    return feedback;
  }

  //댓글 수정
  async update(feedbackId: string, userId: string, dto: UpdateFeedbackDto) {
    await this.checkOwner(feedbackId, userId);
    return this.repository.update(feedbackId, dto.content);
  }

  //댓글 삭제
  async remove(feedbackId: string, userId: string) {
    await this.checkOwner(feedbackId, userId);
    await this.repository.softDelete(feedbackId);
  }

  //좋아요 토글
  async toggleLike(invitationId: string, feedbackId: string, userId: string) {
    const participant = await this.repository.findParticipant(
      userId,
      invitationId,
    );
    if (!participant) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    const feedback = await this.repository.findById(feedbackId);
    if (!feedback) {
      throw new ForbiddenException(ErrorCode.FEEDBACK_NOT_FOUND);
    }

    const existing = await this.repository.findLike(feedbackId, participant.id);

    if (existing) {
      await this.repository.deleteLike(feedbackId, participant.id);
      return { success: true, data: { liked: false } };
    } else {
      await this.repository.createLike(feedbackId, participant.id);
      return { success: true, data: { liked: true } };
    }
  }
}
