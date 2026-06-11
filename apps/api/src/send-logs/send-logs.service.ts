import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../common/constants/error-codes';
import { LinkEventsRepository } from './link-events.repository';
import { SendLogsRepository } from './send-logs.repository';
import type { CreateSendLogDto } from './dto/create-send-log.dto';

@Injectable()
export class SendLogsService {
  constructor(
    private readonly sendLogsRepository: SendLogsRepository,
    private readonly linkEventsRepository: LinkEventsRepository,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, invitationId: string, dto: CreateSendLogDto) {
    const allowed = await this.sendLogsRepository.canShare(invitationId, userId);
    if (!allowed) {
      throw new ForbiddenException({ code: ErrorCode.INSUFFICIENT_ROLE });
    }

    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const inviteUrl = `${frontendUrl}/invitations/${invitationId}`;

    const log = await this.sendLogsRepository.create({
      invitationId,
      senderId: userId,
      channel: dto.channel,
      inviteUrl,
    });

    const inviteUrlWithRef = `${inviteUrl}?ref=${log.id}`;

    if (dto.channel === 'sms') {
      return {
        inviteUrl: inviteUrlWithRef,
        smsUri: `sms:?body=${encodeURIComponent(inviteUrlWithRef)}`,
      };
    }

    return { inviteUrl: inviteUrlWithRef };
  }

  async recordOpen(logId: string) {
    const log = await this.sendLogsRepository.findById(logId);
    if (!log) return;

    await this.linkEventsRepository.createEvent({
      logId,
      eventType: 'opened',
      userId: null,
    });
  }

  async recordJoin(logId: string, userId: string) {
    const log = await this.sendLogsRepository.findById(logId);
    if (!log) return;

    await this.linkEventsRepository.createEvent({
      logId,
      eventType: 'joined',
      userId,
    });
  }
}
