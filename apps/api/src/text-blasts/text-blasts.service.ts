import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTextBlastDto } from './dto/create-text-blast.dto';
import { TextBlastsRepository, type TextBlastRow } from './text-blasts.repository';

export type TextBlastResponse = {
  id: string;
  invitationId: string;
  message: string;
  recipientCount: number;
  createdAt: string;
};

function toResponse(row: TextBlastRow): TextBlastResponse {
  return {
    id: row.id,
    invitationId: row.invitationId,
    message: row.message,
    recipientCount: Number(row.recipientCount),
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class TextBlastsService {
  constructor(
    private readonly repository: TextBlastsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** 호스트가 참석자 전원에게 단체 공지 발송 → text_blast 기록 + 참석자별 알림 팬아웃 */
  async create(
    invitationId: string,
    senderUserId: string,
    dto: CreateTextBlastDto,
  ): Promise<TextBlastResponse> {
    const recipientUserIds = await this.repository.findRecipientUserIds(
      invitationId,
      senderUserId,
    );

    const blast = await this.repository.create({
      invitationId,
      senderUserId,
      message: dto.message,
      recipientCount: String(recipientUserIds.length),
    });

    await Promise.all(
      recipientUserIds.map((userId) =>
        this.notificationsService.notify({
          userId,
          actorUserId: senderUserId,
          type: 'text_blast',
          content: dto.message,
          invitationId,
        }),
      ),
    );

    return toResponse(blast);
  }

  async list(invitationId: string): Promise<TextBlastResponse[]> {
    const rows = await this.repository.findByInvitation(invitationId);
    return rows.map(toResponse);
  }

  async delete(invitationId: string, id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id, invitationId);
    if (!deleted) {
      throw new NotFoundException(ErrorCode.TEXT_BLAST_NOT_FOUND);
    }
  }
}
