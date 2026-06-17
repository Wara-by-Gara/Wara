/**
 * SendLogsService 단위 테스트
 *
 * 검증 대상:
 * - recordOpen: linkEventsRepository.createEvent() 실패 시 예외 전파 없이 조용히 처리
 * - recordJoin: 동일 격리 보장
 * - 두 메서드 모두 DB 에러가 링크 열람/참가 흐름을 중단시키지 않음을 보증
 */
import { SendLogsService } from './send-logs.service';

type MockSendLogsRepo = {
  findById: jest.Mock;
  create: jest.Mock;
  canShare: jest.Mock;
};

type MockLinkEventsRepo = {
  createEvent: jest.Mock;
};

function createService(overrides: {
  sendLogs?: Partial<MockSendLogsRepo>;
  linkEvents?: Partial<MockLinkEventsRepo>;
} = {}) {
  const sendLogsRepo: MockSendLogsRepo = {
    findById: jest.fn().mockResolvedValue({ id: 'log-1' }),
    create: jest.fn(),
    canShare: jest.fn(),
    ...overrides.sendLogs,
  };

  const linkEventsRepo: MockLinkEventsRepo = {
    createEvent: jest.fn().mockResolvedValue({}),
    ...overrides.linkEvents,
  };

  const configService = { getOrThrow: jest.fn().mockReturnValue('https://example.com') };

  const service = new SendLogsService(
    sendLogsRepo as never,
    linkEventsRepo as never,
    configService as never,
  );

  return { service, sendLogsRepo, linkEventsRepo };
}

describe('SendLogsService', () => {
  describe('recordOpen', () => {
    it('log 없으면 createEvent 호출 안 함', async () => {
      const { service, linkEventsRepo } = createService({
        sendLogs: { findById: jest.fn().mockResolvedValue(null) },
      });

      await service.recordOpen('nonexistent-log');

      expect(linkEventsRepo.createEvent).not.toHaveBeenCalled();
    });

    it('createEvent DB 에러 시 예외 전파 없음', async () => {
      const { service, linkEventsRepo } = createService({
        linkEvents: { createEvent: jest.fn().mockRejectedValue(new Error('DB connection lost')) },
      });

      await expect(service.recordOpen('log-1')).resolves.toBeUndefined();
      expect(linkEventsRepo.createEvent).toHaveBeenCalledWith({
        logId: 'log-1',
        eventType: 'opened',
        userId: null,
      });
    });

    it('정상 케이스: opened 이벤트 기록', async () => {
      const { service, linkEventsRepo } = createService();

      await service.recordOpen('log-1');

      expect(linkEventsRepo.createEvent).toHaveBeenCalledWith({
        logId: 'log-1',
        eventType: 'opened',
        userId: null,
      });
    });
  });

  describe('recordJoin', () => {
    it('log 없으면 createEvent 호출 안 함', async () => {
      const { service, linkEventsRepo } = createService({
        sendLogs: { findById: jest.fn().mockResolvedValue(null) },
      });

      await service.recordJoin('nonexistent-log', 'user-1');

      expect(linkEventsRepo.createEvent).not.toHaveBeenCalled();
    });

    it('createEvent DB 에러 시 예외 전파 없음', async () => {
      const { service, linkEventsRepo } = createService({
        linkEvents: { createEvent: jest.fn().mockRejectedValue(new Error('DB connection lost')) },
      });

      await expect(service.recordJoin('log-1', 'user-1')).resolves.toBeUndefined();
      expect(linkEventsRepo.createEvent).toHaveBeenCalledWith({
        logId: 'log-1',
        eventType: 'joined',
        userId: 'user-1',
      });
    });

    it('정상 케이스: joined 이벤트 기록', async () => {
      const { service, linkEventsRepo } = createService();

      await service.recordJoin('log-1', 'user-1');

      expect(linkEventsRepo.createEvent).toHaveBeenCalledWith({
        logId: 'log-1',
        eventType: 'joined',
        userId: 'user-1',
      });
    });
  });
});
