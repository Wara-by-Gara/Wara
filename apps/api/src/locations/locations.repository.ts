import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { and, eq, gt, inArray, isNull, lte, notExists, sql } from 'drizzle-orm';
import {
  eventLocations,
  invitations,
  notifications,
  participantLocations,
  participants,
  users,
} from '../database/schema';
import type { SetEventLocationDto } from './dto/set-event-location.dto';
import type { UpdateParticipantLocationDto } from './dto/update-participant-location.dto';

export type ParticipantLocationWithUser = {
  id: string;
  invitationId: string;
  participantId: string;
  lat: number;
  lng: number;
  accuracy: number;
  isArrived: boolean;
  statusMessage: string | null;
  updatedAt: Date;
  nickname: string | null;
  profileImageUrl: string | null;
  tier?: 'full' | 'distance' | 'hidden';
};

@Injectable()
export class LocationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findEventLocation(invitationId: string) {
    return this.db.query.eventLocations.findFirst({
      where: (t, { eq, and, isNull }) =>
        and(eq(t.invitationId, invitationId), isNull(t.deletedAt)),
    });
  }

  async upsertEventLocation(invitationId: string, dto: SetEventLocationDto) {
    const [result] = await this.db
      .insert(eventLocations)
      .values({ invitationId, ...dto })
      .onConflictDoUpdate({
        target: eventLocations.invitationId,
        set: { ...dto, deletedAt: null, updatedAt: new Date() },
      })
      .returning();
    return result!;
  }

  async deleteEventLocation(invitationId: string) {
    await this.db
      .update(eventLocations)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(eventLocations.invitationId, invitationId),
          isNull(eventLocations.deletedAt),
        ),
      );
  }

  async findParticipantById(id: string, invitationId: string) {
    return this.db.query.participants.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.id, id), eq(t.invitationId, invitationId)),
    });
  }

  async findParticipant(userId: string, invitationId: string) {
    return this.db.query.participants.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.userId, userId), eq(t.invitationId, invitationId)),
    });
  }

  async findParticipantWithUser(userId: string, invitationId: string) {
    return this.db.query.participants.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.userId, userId), eq(t.invitationId, invitationId)),
      with: { user: true },
    });
  }

  async findHostByInvitation(invitationId: string) {
    return this.db.query.participants.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.invitationId, invitationId), eq(t.memberRole, 'HOST')),
    });
  }

  async setArrivedIfNotYet(participantId: string, invitationId: string): Promise<boolean> {
    const result = await this.db
      .update(participantLocations)
      .set({ isArrived: true, updatedAt: new Date() })
      .where(
        and(
          eq(participantLocations.participantId, participantId),
          eq(participantLocations.invitationId, invitationId),
          eq(participantLocations.isArrived, false),
        ),
      )
      .returning({ id: participantLocations.id });
    return result.length > 0;
  }

  async findAllParticipantLocations(
    invitationId: string,
  ): Promise<ParticipantLocationWithUser[]> {
    const rows = await this.db
      .select({
        id: participantLocations.id,
        invitationId: participantLocations.invitationId,
        participantId: participantLocations.participantId,
        lat: participantLocations.lat,
        lng: participantLocations.lng,
        accuracy: participantLocations.accuracy,
        isArrived: participantLocations.isArrived,
        statusMessage: participantLocations.statusMessage,
        updatedAt: participantLocations.updatedAt,
        nickname: users.nickname,
        profileImageUrl: users.profileImageUrl,
      })
      .from(participantLocations)
      .innerJoin(participants, eq(participants.id, participantLocations.participantId))
      .innerJoin(users, eq(users.id, participants.userId))
      .where(eq(participantLocations.invitationId, invitationId));
    return rows;
  }

  async findUserInfoByParticipantIds(
    participantIds: string[],
  ): Promise<
    Map<string, {
      nickname: string | null;
      profileImageUrl: string | null;
      participantTier: 'full' | 'distance' | 'hidden' | null;
      userDefaultTier: 'full' | 'distance' | 'hidden';
    }>
  > {
    if (participantIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        participantId: participants.id,
        nickname: users.nickname,
        profileImageUrl: users.profileImageUrl,
        participantTier: participants.locationTier,
        userDefaultTier: users.defaultLocationTier,
      })
      .from(participants)
      .innerJoin(users, eq(users.id, participants.userId))
      .where(inArray(participants.id, participantIds));
    return new Map(
      rows.map((r) => [
        r.participantId,
        {
          nickname: r.nickname,
          profileImageUrl: r.profileImageUrl,
          participantTier: r.participantTier,
          userDefaultTier: r.userDefaultTier,
        },
      ]),
    );
  }

  /** 유저 기본 티어 설정 */
  async setUserDefaultTier(userId: string, tier: 'full' | 'distance' | 'hidden') {
    await this.db
      .update(users)
      .set({ defaultLocationTier: tier, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  /** 참가자(모임별) 티어 설정. null = 유저 기본값 따름 */
  async setParticipantTier(
    userId: string,
    invitationId: string,
    tier: 'full' | 'distance' | 'hidden' | null,
  ): Promise<string | null> {
    const [row] = await this.db
      .update(participants)
      .set({ locationTier: tier, updatedAt: new Date() })
      .where(and(eq(participants.userId, userId), eq(participants.invitationId, invitationId)))
      .returning({ id: participants.id });
    return row?.id ?? null;
  }

  // GPS upsert 시 활성 상태 검증용. 마감/soft deleted면 broadcast 차단.
  async findInvitationStatus(
    invitationId: string,
  ): Promise<{ status: 'active' | 'closed'; deletedAt: Date | null } | null> {
    const row = await this.db.query.invitations.findFirst({
      where: (t, { eq }) => eq(t.id, invitationId),
      columns: { status: true, deletedAt: true },
    });
    return row ?? null;
  }

  // GPS flush 대상 — status='closed' 또는 soft deleted 초대장.
  // 기존엔 closed만 처리 → soft delete된 active 초대장의 GPS hash가 24h TTL까지 남는 누락.
  async findInvitationsForGpsFlush(): Promise<string[]> {
    const rows = await this.db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        sql`${invitations.status} = 'closed' OR ${invitations.deletedAt} IS NOT NULL`,
      );
    return rows.map((r) => r.id);
  }

  // 사용자 탈퇴 시 Redis GPS entry를 정리하기 위해 user의 모든 participants 매핑 조회.
  // soft deleted 초대장도 포함 (24h TTL이 자연 만료 전까지 stale broadcast 방지).
  async findParticipantsByUserId(
    userId: string,
  ): Promise<Array<{ invitationId: string; participantId: string }>> {
    return this.db
      .select({
        invitationId: participants.invitationId,
        participantId: participants.id,
      })
      .from(participants)
      .where(eq(participants.userId, userId));
  }

  async findAllParticipantUserIds(invitationId: string): Promise<string[]> {
    const rows = await this.db
      .select({ userId: participants.userId })
      .from(participants)
      .where(eq(participants.invitationId, invitationId));
    return rows.map((r) => r.userId);
  }

  /** 모임 시작 15분 이내이고 사전 GPS 알림 미발송인 초대장 */
  async findInvitationsForPreEventNotification(now = new Date()) {
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);
    const preEventSentSubquery = this.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.invitationId, invitations.id),
          eq(notifications.type, 'invitation_date'),
        ),
      );

    return this.db
      .select({
        id: invitations.id,
        title: invitations.title,
        eventStartAt: invitations.eventStartAt,
      })
      .from(invitations)
      .innerJoin(eventLocations, eq(eventLocations.invitationId, invitations.id))
      .where(
        and(
          isNull(invitations.deletedAt),
          eq(invitations.status, 'active'),
          isNull(eventLocations.deletedAt),
          gt(invitations.eventStartAt, now),
          lte(invitations.eventStartAt, windowEnd),
          notExists(preEventSentSubquery),
        ),
      );
  }

  async upsertParticipantLocation(
    invitationId: string,
    participantId: string,
    dto: UpdateParticipantLocationDto,
    statusMessage: string | null = null,
  ) {
    const values = { ...dto, statusMessage };
    const [result] = await this.db
      .insert(participantLocations)
      .values({ invitationId, participantId, ...values })
      .onConflictDoUpdate({
        target: [
          participantLocations.invitationId,
          participantLocations.participantId,
        ],
        set: { ...values, updatedAt: new Date() },
      })
      .returning();
    return result!;
  }
}
