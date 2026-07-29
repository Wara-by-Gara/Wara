import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import {
  Expo,
  type ExpoPushMessage,
  type ExpoPushTicket,
} from 'expo-server-sdk';
import { PushRepository } from './push.repository';
import type { RegisterDeviceDto } from './dto/register-device.dto';

// 푸시 페이로드. 웹은 SW(public/sw.js), 모바일은 expo-notifications 핸들러가 소비.
export interface PushPayload {
  title: string;
  body: string;
  // 클릭/탭 시 이동할 앱 내 경로 — 반드시 상대 경로(예: /chats/:id, /notifications).
  // 절대 URL(https://...)이면 RN Expo Router가 라우팅 못 함.
  url: string;
  // 같은 tag는 OS에서 알림을 합쳐 표시 — 대화방/타입 단위 중복 방지에 사용.
  tag?: string;
  // 유저의 현재 미읽음 알림 개수. iOS 홈에 설치된 웹 PWA는 SW에서 navigator.setAppBadge(badge)로,
  // 네이티브(Expo)는 payload data.badge를 클라이언트가 setBadgeCountAsync로 소비한다.
  badge?: number;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private webPushEnabled = false;
  private publicKey: string | null = null;
  // Expo Push는 access token 없이도 발송 가능 — 클라이언트는 항상 생성한다.
  // EXPO_ACCESS_TOKEN이 있으면 보안 강화 모드로 동작.
  private readonly expo: Expo;

  constructor(
    private readonly config: ConfigService,
    private readonly repository: PushRepository,
  ) {
    this.expo = new Expo({
      accessToken: this.config.get<string>('EXPO_ACCESS_TOKEN'),
    });
  }

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@wara.dev';
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.publicKey = publicKey;
      this.webPushEnabled = true;
    }

    // startup validation — 어떤 푸시 채널이 살아있는지 한눈에 (운영 디버깅).
    const hasExpoToken = !!this.config.get<string>('EXPO_ACCESS_TOKEN');
    this.logger.log(
      `Push channels — Web Push: ${this.webPushEnabled ? 'enabled' : 'disabled (VAPID 키 미설정)'}, ` +
        `Expo Push: enabled${hasExpoToken ? ' (access token)' : ' (no access token)'}`,
    );
  }

  getVapidPublicKey(): string | null {
    return this.publicKey;
  }

  // ── Web Push 구독 (브라우저) ────────────────────────────────────────────────

  async subscribe(
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ) {
    return this.repository.upsert({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent,
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.repository.softDeleteByEndpoint(userId, endpoint);
  }

  // ── 네이티브 푸시 기기 토큰 (Expo, mobile) ─────────────────────────────────

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    return this.repository.upsertDevice({ userId, ...dto });
  }

  async unregisterDevice(userId: string, token: string) {
    await this.repository.softDeleteDeviceByToken(userId, token);
  }

  // ── 발송 ────────────────────────────────────────────────────────────────────

  // 유저의 모든 활성 기기로 푸시 발송 (Web Push + Expo 병행).
  // best-effort — 채널 간 직렬화/지연 금지(allSettled). 실패해도 알림 흐름을 막지 않음.
  async send(userId: string, payload: PushPayload): Promise<void> {
    await Promise.allSettled([
      this.sendWebPush(userId, payload),
      this.sendExpoPush(userId, payload),
    ]);
  }

  // 유저의 모든 활성 브라우저 구독으로 Web Push 발송. 만료(404/410) 구독은 정리.
  private async sendWebPush(
    userId: string,
    payload: PushPayload,
  ): Promise<void> {
    if (!this.webPushEnabled) return;
    const subscriptions = await this.repository.findActiveByUser(userId);
    if (subscriptions.length === 0) return;

    const body = JSON.stringify(payload);
    await Promise.all(
      subscriptions.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.repository.softDeleteById(s.id);
          } else {
            this.logger.warn(
              `web push 발송 실패 (user=${userId}, status=${statusCode ?? 'unknown'})`,
            );
          }
        }
      }),
    );
  }

  // 유저의 모든 활성 기기 토큰으로 Expo Push 발송. ticket 에러로 무효 토큰 정리.
  private async sendExpoPush(
    userId: string,
    payload: PushPayload,
  ): Promise<void> {
    const devices = await this.repository.findActiveDevicesByUser(userId);
    if (devices.length === 0) return;

    // 발송 대상 메시지 + token→tokenId 매핑(무효 토큰 정리용).
    const tokenToId = new Map<string, string>();
    const messages: ExpoPushMessage[] = [];
    for (const d of devices) {
      if (!Expo.isExpoPushToken(d.token)) {
        // 형식이 깨진 토큰은 바로 정리.
        await this.repository.softDeleteDeviceById(d.id);
        continue;
      }
      tokenToId.set(d.token, d.id);
      messages.push({
        to: d.token,
        title: payload.title,
        body: payload.body,
        // iOS 홈 아이콘 배지 카운트 — Expo가 APNs로 badge 필드 매핑.
        ...(typeof payload.badge === 'number' ? { badge: payload.badge } : {}),
        // 딥링크용 url(상대 경로) + 중복 합치기용 tag를 data로 전달.
        data: {
          url: payload.url,
          ...(payload.tag ? { tag: payload.tag } : {}),
          ...(typeof payload.badge === 'number' ? { badge: payload.badge } : {}),
        },
      });
    }
    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        await Promise.all(
          tickets.map((ticket, i) =>
            this.handleExpoTicket(ticket, chunk[i]!, tokenToId, userId),
          ),
        );
      } catch (err) {
        // 청크 전송 자체 실패(네트워크 등) — best-effort, 로깅만.
        this.logger.warn(
          `expo push 청크 발송 실패 (user=${userId}): ${(err as Error).message}`,
        );
      }
    }
  }

  // 발송 ticket 에러 분기. DeviceNotRegistered만 처리하지 않고 운영 신호도 로깅.
  // 참고: 일부 에러(특히 DeviceNotRegistered)는 receipt에서 지연 확인될 수 있다.
  // 비동기 receipt 폴링(getPushNotificationReceiptsAsync) + lastSeenAt 기반 정리는 후속.
  private async handleExpoTicket(
    ticket: ExpoPushTicket,
    message: ExpoPushMessage,
    tokenToId: Map<string, string>,
    userId: string,
  ): Promise<void> {
    if (ticket.status === 'ok') return;

    const to = Array.isArray(message.to) ? message.to[0] : message.to;
    const error = ticket.details?.error;
    switch (error) {
      case 'DeviceNotRegistered': {
        const id = to ? tokenToId.get(to) : undefined;
        if (id) await this.repository.softDeleteDeviceById(id);
        break;
      }
      case 'MessageTooBig':
        this.logger.warn(
          `expo push payload 초과 (user=${userId}) — payload 축소 필요`,
        );
        break;
      case 'InvalidCredentials':
        // 운영에서 즉시 발견해야 함 — EXPO_ACCESS_TOKEN 문제.
        this.logger.error(
          'expo push InvalidCredentials — EXPO_ACCESS_TOKEN 설정 확인 필요',
        );
        break;
      default:
        this.logger.warn(
          `expo push ticket 에러 (user=${userId}, error=${error ?? 'unknown'}): ${ticket.message}`,
        );
    }
  }
}
