import { Inject, Injectable } from '@nestjs/common';
import { and, between, count, eq, sql } from 'drizzle-orm';
import {
  invitationLinkEvents,
  invitationSendLogs,
  participants,
} from '../../drizzle/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

export type ChannelStat = {
  channel: string;
  sends: number;
  opens: number;
  joins: number;
};
export type HourCount = { hour: number; opens: number };
export type ConversionCounts = {
  sent: number;
  opened: number;
  openedAuthed: number; // opened 중 user_id NOT NULL distinct log (이미 로그인 상태로 방문)
  joined: number;
};
export type ViralCounts = {
  hostSends: number;
  guestSends: number;
  unattributedSends: number; // sender ∉ participants (탈퇴 등) — 분석 분모에서 제외
};

@Injectable()
export class ShareAnalyticsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  // ── 1. 채널별 공유 효과 (sends/opens/joins) ──────────────────────────────
  // "어떤 채널이 효과적인가" — 발송 횟수만으론 부족하므로 opens/joins도 함께.
  // sendLogs.createdAt 기준 필터, 그 sendLog에 연결된 모든 link_events 카운트.
  async countByChannel(from: Date, to: Date): Promise<ChannelStat[]> {
    const rows = await this.db
      .select({
        channel: invitationSendLogs.channel,
        sends: sql<number>`COUNT(DISTINCT ${invitationSendLogs.id})::int`,
        opens: sql<number>`COUNT(DISTINCT CASE WHEN ${invitationLinkEvents.eventType} = 'opened' THEN ${invitationLinkEvents.logId} END)::int`,
        joins: sql<number>`COUNT(DISTINCT CASE WHEN ${invitationLinkEvents.eventType} = 'joined' THEN ${invitationLinkEvents.logId} END)::int`,
      })
      .from(invitationSendLogs)
      .leftJoin(
        invitationLinkEvents,
        eq(invitationLinkEvents.logId, invitationSendLogs.id),
      )
      .where(between(invitationSendLogs.createdAt, from, to))
      .groupBy(invitationSendLogs.channel);
    return rows.map((r) => ({
      channel: r.channel,
      sends: Number(r.sends),
      opens: Number(r.opens),
      joins: Number(r.joins),
    }));
  }

  // ── 2. 전환 깔때기 ──────────────────────────────────────────────────────
  // 기간 = sendLogs.createdAt 기준 발송된 logs의 집합.
  // opened/openedAuthed/joined도 그 logs에 연결된 link_events 만 카운트
  // (link_events.createdAt 기준이 아님 → openRate > 1 같은 비정상 방지).
  // 단일 LEFT JOIN 쿼리로 4개 count를 한 번에 가져옴.
  async conversionCounts(from: Date, to: Date): Promise<ConversionCounts> {
    const [row] = await this.db
      .select({
        sent: sql<number>`COUNT(DISTINCT ${invitationSendLogs.id})::int`,
        opened: sql<number>`COUNT(DISTINCT CASE WHEN ${invitationLinkEvents.eventType} = 'opened' THEN ${invitationLinkEvents.logId} END)::int`,
        openedAuthed: sql<number>`COUNT(DISTINCT CASE WHEN ${invitationLinkEvents.eventType} = 'opened' AND ${invitationLinkEvents.userId} IS NOT NULL THEN ${invitationLinkEvents.logId} END)::int`,
        joined: sql<number>`COUNT(DISTINCT CASE WHEN ${invitationLinkEvents.eventType} = 'joined' THEN ${invitationLinkEvents.logId} END)::int`,
      })
      .from(invitationSendLogs)
      .leftJoin(
        invitationLinkEvents,
        eq(invitationLinkEvents.logId, invitationSendLogs.id),
      )
      .where(between(invitationSendLogs.createdAt, from, to));

    return {
      sent: Number(row?.sent ?? 0),
      opened: Number(row?.opened ?? 0),
      openedAuthed: Number(row?.openedAuthed ?? 0),
      joined: Number(row?.joined ?? 0),
    };
  }

  // ── 3. 바이럴 (sender_id의 participant role 기준) ────────────────────────
  // send_logs.sender_id ↔ participants (invitation_id + user_id) join
  // role=null (탈퇴/외부 발송 등)은 unattributedSends로 분리 — guestViralRatio 분모에서 제외
  async viralCounts(from: Date, to: Date): Promise<ViralCounts> {
    const rows = await this.db
      .select({
        role: participants.memberRole,
        c: count(),
      })
      .from(invitationSendLogs)
      .leftJoin(
        participants,
        and(
          eq(participants.userId, invitationSendLogs.senderId),
          eq(participants.invitationId, invitationSendLogs.invitationId),
        ),
      )
      .where(between(invitationSendLogs.createdAt, from, to))
      .groupBy(participants.memberRole);

    let host = 0;
    let guest = 0;
    let unattributed = 0;
    for (const r of rows) {
      const n = Number(r.c);
      if (r.role === 'HOST') host += n;
      else if (r.role === 'GUEST') guest += n;
      else unattributed += n;
    }
    return {
      hostSends: host,
      guestSends: guest,
      unattributedSends: unattributed,
    };
  }

  // ── 4. 시간대별 오픈 분포 ────────────────────────────────────────────────
  // 한국 서비스 기준 KST(Asia/Seoul) 시각의 0~23시. UTC로 저장된 created_at을
  // 명시적으로 KST로 변환해서 EXTRACT — 서버 timezone 변경에도 결과 일관.
  async opensByHour(from: Date, to: Date): Promise<HourCount[]> {
    const hourExpr = sql<number>`EXTRACT(HOUR FROM ${invitationLinkEvents.createdAt} AT TIME ZONE 'Asia/Seoul')::int`;
    const rows = await this.db
      .select({ hour: hourExpr, opens: count() })
      .from(invitationLinkEvents)
      .where(
        and(
          eq(invitationLinkEvents.eventType, 'opened'),
          between(invitationLinkEvents.createdAt, from, to),
        ),
      )
      .groupBy(hourExpr);

    return rows.map((r) => ({
      hour: Number(r.hour),
      opens: Number(r.opens),
    }));
  }
}
