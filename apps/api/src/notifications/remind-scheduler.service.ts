import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RemindSchedulerRepository, type RemindType } from './remind-scheduler.repository';
import { NotificationsService } from './notifications.service';

const REMIND_CONTENTS: Record<RemindType, (title: string) => string> = {
  'D-1': (title) => `내일 ${title} 모임이 있어요! 잊지 마세요 🗓️`,
  'D+7': (title) => `${title} 모임이 일주일이 됐어요!`,
  'D+30': (title) => `${title} 모임이 한 달이 됐어요!`,
  'D+365': (title) => `${title} 모임이 1년이 됐어요!`,
};

@Injectable()
export class RemindSchedulerService {
  private readonly logger = new Logger(RemindSchedulerService.name);

  constructor(
    private readonly repository: RemindSchedulerRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  // 매일 오전 10시 (KST)
  @Cron('0 10 * * *', { timeZone: 'Asia/Seoul' })
  async sendDailyReminders() {
    this.logger.log('리마인드 알림 크론 잡 시작');

    for (const remindType of ['D-1', 'D+7', 'D+30', 'D+365'] as const) {
      try {
        await this.processRemindType(remindType);
      } catch (error) {
        this.logger.error(`${remindType} 리마인드 처리 중 오류`, error);
      }
    }

    this.logger.log('리마인드 알림 크론 잡 완료');
  }

  private async processRemindType(remindType: RemindType) {
    const targets = await this.repository.findRemindTargets(remindType);
    const contentFn = REMIND_CONTENTS[remindType];

    const results = await Promise.allSettled(
      targets.flatMap(({ invitation, participants }) =>
        participants.map((p) =>
          this.notificationsService.notify({
            userId: p.userId,
            type: 'remind',
            content: contentFn(invitation.title),
            targetType: 'invitation',
            targetId: invitation.id,
            invitationId: invitation.id,
          }),
        ),
      ),
    );

    const failCount = results.filter((r) => r.status === 'rejected').length;
    if (failCount > 0) {
      this.logger.warn(`${remindType} 리마인드: ${failCount}건 발송 실패`);
    }

    await this.repository.markAsSentBatch(
      targets.map((t) => t.invitation.id),
      remindType,
    );

    this.logger.log(`${remindType} 리마인드 ${targets.length}건 처리 완료`);
  }
}
