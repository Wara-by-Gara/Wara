/**
 * PushService 단위 테스트 (네이티브 Expo 채널)
 *
 * 검증 대상:
 * - send(): web/expo를 best-effort로 병행 디스패치 (Expo 발송 실패해도 throw 없음)
 * - sendExpoPush: 활성 기기 토큰으로 메시지 구성 (딥링크 url을 data로, 상대 경로 유지)
 * - 형식 깨진 토큰은 발송 제외 + soft delete
 * - ticket 에러 분기: DeviceNotRegistered → soft delete, InvalidCredentials → error 로그
 * - 기기 없으면 Expo 발송 호출 안 함
 */
// expo-server-sdk는 ESM-only(type: module) — ts-jest(CJS)가 로드 못 함.
// 단위 테스트에선 mock으로 대체(실제 발송은 service.expo를 fake로 덮어씀).
jest.mock('expo-server-sdk', () => ({
  Expo: class {
    static isExpoPushToken(token: unknown) {
      return typeof token === 'string' && token.startsWith('ExponentPushToken[');
    }
    chunkPushNotifications(msgs: unknown[]) {
      return [msgs];
    }
    sendPushNotificationsAsync = jest.fn();
  },
}));

import { PushService } from './push.service';

const VALID_TOKEN = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
const PAYLOAD = { title: '새 메시지', body: '안녕', url: '/chats/123', tag: 'dm-123' };

type FakeExpo = {
  chunkPushNotifications: jest.Mock;
  sendPushNotificationsAsync: jest.Mock;
};

function createService(
  devices: Array<{ id: string; token: string }>,
  sendImpl?: jest.Mock,
) {
  const repository = {
    findActiveByUser: jest.fn().mockResolvedValue([]), // web push 비대상
    findActiveDevicesByUser: jest.fn().mockResolvedValue(devices),
    softDeleteDeviceById: jest.fn().mockResolvedValue(undefined),
    softDeleteById: jest.fn().mockResolvedValue(undefined),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) }; // VAPID/EXPO 키 없음

  const service = new PushService(config as never, repository as never);
  service.onModuleInit();

  const fakeExpo: FakeExpo = {
    // 단일 청크로 그대로 반환
    chunkPushNotifications: jest.fn((msgs: unknown[]) => [msgs]),
    sendPushNotificationsAsync:
      sendImpl ??
      jest.fn().mockResolvedValue(devices.map(() => ({ status: 'ok', id: 'r1' }))),
  };
  (service as unknown as { expo: FakeExpo }).expo = fakeExpo;

  return { service, repository, fakeExpo };
}

describe('PushService — Expo 네이티브 채널', () => {
  it('활성 기기로 메시지 구성: 딥링크 url을 data로(상대 경로), title/body 전달', async () => {
    const { service, fakeExpo } = createService([
      { id: 'd1', token: VALID_TOKEN },
    ]);

    await service.send('user-1', PAYLOAD);

    expect(fakeExpo.sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    const sentChunk = fakeExpo.sendPushNotificationsAsync.mock.calls[0][0];
    expect(sentChunk).toEqual([
      {
        to: VALID_TOKEN,
        title: '새 메시지',
        body: '안녕',
        data: { url: '/chats/123', tag: 'dm-123' },
      },
    ]);
  });

  it('기기 없으면 Expo 발송 호출 안 함', async () => {
    const { service, fakeExpo } = createService([]);

    await service.send('user-1', PAYLOAD);

    expect(fakeExpo.sendPushNotificationsAsync).not.toHaveBeenCalled();
  });

  it('형식 깨진 토큰은 발송 제외 + soft delete', async () => {
    const { service, repository, fakeExpo } = createService([
      { id: 'bad', token: 'not-a-token' },
      { id: 'd1', token: VALID_TOKEN },
    ]);

    await service.send('user-1', PAYLOAD);

    expect(repository.softDeleteDeviceById).toHaveBeenCalledWith('bad');
    const sentChunk = fakeExpo.sendPushNotificationsAsync.mock.calls[0][0];
    expect(sentChunk).toHaveLength(1);
    expect(sentChunk[0].to).toBe(VALID_TOKEN);
  });

  it('DeviceNotRegistered ticket → 해당 토큰 soft delete', async () => {
    const sendImpl = jest.fn().mockResolvedValue([
      {
        status: 'error',
        message: 'not registered',
        details: { error: 'DeviceNotRegistered' },
      },
    ]);
    const { service, repository } = createService(
      [{ id: 'd1', token: VALID_TOKEN }],
      sendImpl,
    );

    await service.send('user-1', PAYLOAD);

    expect(repository.softDeleteDeviceById).toHaveBeenCalledWith('d1');
  });

  it('InvalidCredentials ticket → error 로그 (토큰은 보존)', async () => {
    const sendImpl = jest.fn().mockResolvedValue([
      {
        status: 'error',
        message: 'bad credentials',
        details: { error: 'InvalidCredentials' },
      },
    ]);
    const { service, repository } = createService(
      [{ id: 'd1', token: VALID_TOKEN }],
      sendImpl,
    );
    const errorSpy = jest
      .spyOn((service as unknown as { logger: { error: jest.Mock } }).logger, 'error')
      .mockImplementation(() => undefined);

    await service.send('user-1', PAYLOAD);

    expect(errorSpy).toHaveBeenCalled();
    expect(repository.softDeleteDeviceById).not.toHaveBeenCalled();
  });

  it('best-effort: Expo 발송이 throw해도 send는 resolve', async () => {
    const sendImpl = jest.fn().mockRejectedValue(new Error('network down'));
    const { service } = createService(
      [{ id: 'd1', token: VALID_TOKEN }],
      sendImpl,
    );

    await expect(service.send('user-1', PAYLOAD)).resolves.toBeUndefined();
  });
});
