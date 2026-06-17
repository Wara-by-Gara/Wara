/**
 * expo-server-sdk 테스트 stub.
 *
 * 실제 패키지는 ESM-only(undici 등 ESM 의존)라 ts-jest(CJS)가 로드하지 못한다.
 * push.service를 전이 import하는 모든 spec에서 안전하게 동작하도록 전역 매핑한다
 * (jest moduleNameMapper). push 발송 자체를 검증하는 spec은 자체 jest.mock으로 덮어쓴다.
 */
export class Expo {
  constructor(_options?: unknown) {}
  static isExpoPushToken(_token: unknown): boolean {
    return false;
  }
  chunkPushNotifications(messages: unknown[]): unknown[][] {
    return messages.length ? [messages] : [];
  }
  async sendPushNotificationsAsync(_chunk: unknown): Promise<unknown[]> {
    return [];
  }
}

export type ExpoPushMessage = Record<string, unknown>;
export type ExpoPushTicket = Record<string, unknown>;
export type ExpoPushReceipt = Record<string, unknown>;
