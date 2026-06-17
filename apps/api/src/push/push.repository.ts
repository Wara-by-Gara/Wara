import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { and, eq, isNull } from 'drizzle-orm';
import { pushSubscriptions, deviceTokens } from '../database/schema';
import type { DevicePlatform } from './push.types';

@Injectable()
export class PushRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  // 유저의 활성 구독 전체 (PC + 폰 등 멀티 기기)
  async findActiveByUser(userId: string) {
    return this.db.query.pushSubscriptions.findMany({
      where: (t, { eq, and, isNull }) =>
        and(eq(t.userId, userId), isNull(t.deletedAt)),
    });
  }

  // endpoint 기준 upsert — 재구독/소유자 변경 시 갱신하고 soft delete된 행은 재활성화
  async upsert(data: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string | null;
  }) {
    const [result] = await this.db
      .insert(pushSubscriptions)
      .values(data)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: data.userId,
          p256dh: data.p256dh,
          auth: data.auth,
          userAgent: data.userAgent ?? null,
          deletedAt: null,
        },
      })
      .returning();
    return result!;
  }

  // 로그아웃/해제 — 본인 구독만 soft delete
  async softDeleteByEndpoint(userId: string, endpoint: string) {
    await this.db
      .update(pushSubscriptions)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint),
          isNull(pushSubscriptions.deletedAt),
        ),
      );
  }

  // 만료(404/410) 구독 정리
  async softDeleteById(id: string) {
    await this.db
      .update(pushSubscriptions)
      .set({ deletedAt: new Date() })
      .where(eq(pushSubscriptions.id, id));
  }

  // ── 네이티브 푸시 기기 토큰 (Expo) ──────────────────────────────────────────

  // 유저의 활성 기기 토큰 전체 (폰 + 태블릿 등 멀티 기기)
  async findActiveDevicesByUser(userId: string) {
    return this.db.query.deviceTokens.findMany({
      where: (t, { eq, and, isNull }) =>
        and(eq(t.userId, userId), isNull(t.deletedAt)),
    });
  }

  // token 기준 upsert — 재설치/토큰 회전/소유자 변경 시 갱신.
  // lastSeenAt 터치 + soft delete된 행은 재활성화(deletedAt = null).
  async upsertDevice(data: {
    userId: string;
    token: string;
    platform: DevicePlatform;
    deviceId?: string | null;
    deviceName?: string | null;
    appVersion?: string | null;
  }) {
    const [result] = await this.db
      .insert(deviceTokens)
      .values({
        userId: data.userId,
        token: data.token,
        platform: data.platform,
        deviceId: data.deviceId ?? null,
        deviceName: data.deviceName ?? null,
        appVersion: data.appVersion ?? null,
      })
      .onConflictDoUpdate({
        target: deviceTokens.token,
        set: {
          userId: data.userId,
          platform: data.platform,
          deviceId: data.deviceId ?? null,
          deviceName: data.deviceName ?? null,
          appVersion: data.appVersion ?? null,
          lastSeenAt: new Date(),
          deletedAt: null,
        },
      })
      .returning();
    return result!;
  }

  // 로그아웃/해제 — 본인 기기 토큰만 soft delete
  async softDeleteDeviceByToken(userId: string, token: string) {
    await this.db
      .update(deviceTokens)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(deviceTokens.userId, userId),
          eq(deviceTokens.token, token),
          isNull(deviceTokens.deletedAt),
        ),
      );
  }

  // 만료(DeviceNotRegistered) 토큰 정리
  async softDeleteDeviceById(id: string) {
    await this.db
      .update(deviceTokens)
      .set({ deletedAt: new Date() })
      .where(eq(deviceTokens.id, id));
  }
}
