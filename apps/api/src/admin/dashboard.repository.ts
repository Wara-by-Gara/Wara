import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  between,
  count,
  eq,
  gte,
  isNotNull,
  isNull,
  ne,
  sql,
} from 'drizzle-orm';
import {
  feedbacks,
  inquiries,
  invitationBlocklists,
  invitationLinkEvents,
  invitationSendLogs,
  invitations,
  participants,
  socialAccounts,
  users,
} from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

const KST = `'Asia/Seoul'`;
// date_trunc 버킷에 사용자 입력이 들어오지 않도록 허용 값만 매핑.
type Bucket = 'day' | 'week' | 'month';

export type PeriodCount = { period: string; count: number };
export type LabelCount = { label: string; count: number };
export type RetentionRow = {
  cohortWeek: string;
  weekOffset: number;
  users: number;
};
export type ReHostRow = { inviteCount: number; hosts: number };

@Injectable()
export class DashboardRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * 활동 유저 근사용 union CTE.
   * lastLoginAt이 단일 컬럼이라 과거 시계열을 못 만들기 때문에,
   * createdAt이 남는 핵심 행동(초대장 생성·참가·발송·링크 방문)을 합쳐
   * "그 날 무언가 한 유저"로 활성 유저를 근사한다.
   */
  private activityCte() {
    return this.db.$with('activity').as(
      this.db
        .select({
          userId: invitations.userId,
          createdAt: invitations.createdAt,
        })
        .from(invitations)
        .where(isNull(invitations.deletedAt))
        .unionAll(
          this.db
            .select({
              userId: participants.userId,
              createdAt: participants.createdAt,
            })
            .from(participants),
        )
        .unionAll(
          this.db
            .select({
              userId: invitationSendLogs.senderId,
              createdAt: invitationSendLogs.createdAt,
            })
            .from(invitationSendLogs),
        )
        .unionAll(
          this.db
            .select({
              userId: sql<string>`${invitationLinkEvents.userId}`.as('user_id'),
              createdAt: invitationLinkEvents.createdAt,
            })
            .from(invitationLinkEvents)
            .where(isNotNull(invitationLinkEvents.userId)),
        )
        .unionAll(
          this.db
            .select({
              userId: users.id,
              createdAt: sql<Date>`${users.lastLoginAt}`.as('created_at'),
            })
            .from(users)
            .where(isNotNull(users.lastLoginAt)),
        ),
    );
  }

  // ── 활성 유저 ────────────────────────────────────────────────────────────

  /** 버킷(일/주/월)별 distinct 활성 유저 시계열. */
  async activeUsersByBucket(
    from: Date,
    to: Date,
    bucket: Bucket,
  ): Promise<PeriodCount[]> {
    const activity = this.activityCte();
    // bucket을 바인드 파라미터로 넘기면 동일 periodExpr이 SELECT와 GROUP BY에서
    // 서로 다른 placeholder($1, $N)로 직렬화되어 Postgres가 같은 표현식으로 인식하지 못한다
    // (column must appear in GROUP BY 오류). enum이 보장되므로 안전하게 raw 리터럴로 인라인한다.
    const safeBucket: Bucket =
      bucket === 'week' ? 'week' : bucket === 'month' ? 'month' : 'day';
    const periodExpr = sql<string>`to_char(date_trunc(${sql.raw(`'${safeBucket}'`)}, ${activity.createdAt} AT TIME ZONE ${sql.raw(KST)}), 'YYYY-MM-DD')`;
    const rows = await this.db
      .with(activity)
      .select({
        period: periodExpr,
        count: sql<number>`COUNT(DISTINCT ${activity.userId})::int`,
      })
      .from(activity)
      .where(between(activity.createdAt, from, to))
      .groupBy(periodExpr)
      .orderBy(periodExpr);
    return rows.map((r) => ({ period: r.period, count: Number(r.count) }));
  }

  /** since 이후 활동한 distinct 유저 수 (rolling DAU/WAU/MAU 단일값). */
  async activeUserCount(since: Date): Promise<number> {
    const activity = this.activityCte();
    const [row] = await this.db
      .with(activity)
      .select({ c: sql<number>`COUNT(DISTINCT ${activity.userId})::int` })
      .from(activity)
      .where(gte(activity.createdAt, since));
    return Number(row?.c ?? 0);
  }

  /** 가입 주 코호트 × 활동 주차 retention 그리드 원자료. */
  async retentionCohorts(cohortStart: Date): Promise<RetentionRow[]> {
    const activity = this.activityCte();
    const cohort = this.db.$with('cohort').as(
      this.db
        .select({
          userId: users.id,
          cohortWeek:
            sql<string>`date_trunc('week', ${users.createdAt} AT TIME ZONE ${sql.raw(KST)})`.as(
              'cohort_week',
            ),
        })
        .from(users)
        .where(and(isNull(users.deletedAt), gte(users.createdAt, cohortStart))),
    );
    const activeWeeks = this.db.$with('active_weeks').as(
      this.db
        .selectDistinct({
          userId: activity.userId,
          activeWeek:
            sql<string>`date_trunc('week', ${activity.createdAt} AT TIME ZONE ${sql.raw(KST)})`.as(
              'active_week',
            ),
        })
        .from(activity),
    );

    const offsetExpr = sql<number>`(EXTRACT(EPOCH FROM (${activeWeeks.activeWeek} - ${cohort.cohortWeek})) / 604800)::int`;
    const rows = await this.db
      .with(activity, cohort, activeWeeks)
      .select({
        cohortWeek: sql<string>`to_char(${cohort.cohortWeek}, 'YYYY-MM-DD')`,
        weekOffset: offsetExpr,
        users: sql<number>`COUNT(DISTINCT ${cohort.userId})::int`,
      })
      .from(cohort)
      .innerJoin(
        activeWeeks,
        and(
          eq(activeWeeks.userId, cohort.userId),
          gte(activeWeeks.activeWeek, cohort.cohortWeek),
        ),
      )
      .groupBy(cohort.cohortWeek, offsetExpr)
      .orderBy(cohort.cohortWeek, offsetExpr);
    return rows.map((r) => ({
      cohortWeek: r.cohortWeek,
      weekOffset: Number(r.weekOffset),
      users: Number(r.users),
    }));
  }

  /** 코호트(가입 주)별 가입자 수 — retention 분모. */
  async cohortSizes(cohortStart: Date): Promise<PeriodCount[]> {
    const weekExpr = sql<string>`to_char(date_trunc('week', ${users.createdAt} AT TIME ZONE ${sql.raw(KST)}), 'YYYY-MM-DD')`;
    const rows = await this.db
      .select({ period: weekExpr, count: count() })
      .from(users)
      .where(and(isNull(users.deletedAt), gte(users.createdAt, cohortStart)))
      .groupBy(weekExpr)
      .orderBy(weekExpr);
    return rows.map((r) => ({ period: r.period, count: Number(r.count) }));
  }

  // ── 단발 카운트 (overview) ───────────────────────────────────────────────

  /** 탈퇴하지 않은 전체 유저 수. */
  async totalUsers(): Promise<number> {
    const [row] = await this.db
      .select({ c: count() })
      .from(users)
      .where(isNull(users.deletedAt));
    return Number(row?.c ?? 0);
  }

  /** 기간 내 신규 가입 수. */
  async newUserCount(from: Date, to: Date): Promise<number> {
    const [row] = await this.db
      .select({ c: count() })
      .from(users)
      .where(between(users.createdAt, from, to));
    return Number(row?.c ?? 0);
  }

  /** 살아있는 전체 초대장 수. */
  async totalInvitations(): Promise<number> {
    const [row] = await this.db
      .select({ c: count() })
      .from(invitations)
      .where(isNull(invitations.deletedAt));
    return Number(row?.c ?? 0);
  }

  /** 기간 내 생성된 초대장 수. */
  async invitationCount(from: Date, to: Date): Promise<number> {
    const [row] = await this.db
      .select({ c: count() })
      .from(invitations)
      .where(
        and(
          between(invitations.createdAt, from, to),
          isNull(invitations.deletedAt),
        ),
      );
    return Number(row?.c ?? 0);
  }

  /** 기간 내 발송(공유) 수. */
  async sendCount(from: Date, to: Date): Promise<number> {
    const [row] = await this.db
      .select({ c: count() })
      .from(invitationSendLogs)
      .where(between(invitationSendLogs.createdAt, from, to));
    return Number(row?.c ?? 0);
  }

  /** 미답변(resolved 아님) 문의 수 — 운영 헬스. */
  async pendingInquiryCount(): Promise<number> {
    const [row] = await this.db
      .select({ c: count() })
      .from(inquiries)
      .where(and(isNull(inquiries.deletedAt), ne(inquiries.status, 'resolved')));
    return Number(row?.c ?? 0);
  }

  /** 현재 유효한 차단 수 — 모더레이션 신호. */
  async activeBlocklistCount(): Promise<number> {
    const [row] = await this.db
      .select({ c: count() })
      .from(invitationBlocklists)
      .where(isNull(invitationBlocklists.deletedAt));
    return Number(row?.c ?? 0);
  }

  // ── 성장(가입/탈퇴) ──────────────────────────────────────────────────────

  /** 일별 신규 가입 추이. */
  async newUsersByDay(from: Date, to: Date): Promise<PeriodCount[]> {
    const dayExpr = sql<string>`to_char(date_trunc('day', ${users.createdAt} AT TIME ZONE ${sql.raw(KST)}), 'YYYY-MM-DD')`;
    const rows = await this.db
      .select({ period: dayExpr, count: count() })
      .from(users)
      .where(between(users.createdAt, from, to))
      .groupBy(dayExpr)
      .orderBy(dayExpr);
    return rows.map((r) => ({ period: r.period, count: Number(r.count) }));
  }

  /** 소셜 provider별 가입 분포 (탈퇴 제외). */
  async usersByProvider(): Promise<LabelCount[]> {
    const rows = await this.db
      .select({ label: socialAccounts.provider, count: count() })
      .from(socialAccounts)
      .innerJoin(users, eq(users.id, socialAccounts.userId))
      .where(isNull(users.deletedAt))
      .groupBy(socialAccounts.provider);
    return rows.map((r) => ({ label: r.label, count: Number(r.count) }));
  }

  /** 일별 탈퇴 추이. */
  async withdrawalsByDay(from: Date, to: Date): Promise<PeriodCount[]> {
    const dayExpr = sql<string>`to_char(date_trunc('day', ${users.deletedAt} AT TIME ZONE ${sql.raw(KST)}), 'YYYY-MM-DD')`;
    const rows = await this.db
      .select({ period: dayExpr, count: count() })
      .from(users)
      .where(
        and(isNotNull(users.deletedAt), between(users.deletedAt, from, to)),
      )
      .groupBy(dayExpr)
      .orderBy(dayExpr);
    return rows.map((r) => ({ period: r.period, count: Number(r.count) }));
  }

  /** 탈퇴 사유 분포 (만족도 데이터 부재의 대체 신호). */
  async withdrawalReasons(from: Date, to: Date): Promise<LabelCount[]> {
    const reasonExpr = sql<string>`COALESCE(${users.withdrawalReason}, 'unknown')`;
    const rows = await this.db
      .select({ label: reasonExpr, count: count() })
      .from(users)
      .where(
        and(isNotNull(users.deletedAt), between(users.deletedAt, from, to)),
      )
      .groupBy(reasonExpr)
      .orderBy(reasonExpr);
    return rows.map((r) => ({ label: r.label, count: Number(r.count) }));
  }

  // ── 초대장(모임) ─────────────────────────────────────────────────────────

  /** 일별 초대장 생성 추이. */
  async invitationsByDay(from: Date, to: Date): Promise<PeriodCount[]> {
    const dayExpr = sql<string>`to_char(date_trunc('day', ${invitations.createdAt} AT TIME ZONE ${sql.raw(KST)}), 'YYYY-MM-DD')`;
    const rows = await this.db
      .select({ period: dayExpr, count: count() })
      .from(invitations)
      .where(
        and(
          between(invitations.createdAt, from, to),
          isNull(invitations.deletedAt),
        ),
      )
      .groupBy(dayExpr)
      .orderBy(dayExpr);
    return rows.map((r) => ({ period: r.period, count: Number(r.count) }));
  }

  /** 일별 발송(공유) 추이. */
  async sendsByDay(from: Date, to: Date): Promise<PeriodCount[]> {
    const dayExpr = sql<string>`to_char(date_trunc('day', ${invitationSendLogs.createdAt} AT TIME ZONE ${sql.raw(KST)}), 'YYYY-MM-DD')`;
    const rows = await this.db
      .select({ period: dayExpr, count: count() })
      .from(invitationSendLogs)
      .where(between(invitationSendLogs.createdAt, from, to))
      .groupBy(dayExpr)
      .orderBy(dayExpr);
    return rows.map((r) => ({ period: r.period, count: Number(r.count) }));
  }

  /**
   * 호스트별 초대장 생성 횟수 분포.
   * 재개설 비율 = (2회 이상 개설 호스트) / (전체 호스트).
   */
  async reHostDistribution(): Promise<ReHostRow[]> {
    const sub = this.db
      .select({
        userId: invitations.userId,
        c: count().as('host_invite_count'),
      })
      .from(invitations)
      .where(isNull(invitations.deletedAt))
      .groupBy(invitations.userId)
      .as('sub');
    const rows = await this.db
      .select({ inviteCount: sub.c, hosts: count() })
      .from(sub)
      .groupBy(sub.c)
      .orderBy(sub.c);
    return rows.map((r) => ({
      inviteCount: Number(r.inviteCount),
      hosts: Number(r.hosts),
    }));
  }

  /** 기간 내 생성 초대장의 평균 참가자 수 (engagement). */
  async avgParticipantsPerInvitation(from: Date, to: Date): Promise<number> {
    const sub = this.db
      .select({
        invitationId: participants.invitationId,
        c: count().as('participant_count'),
      })
      .from(participants)
      .innerJoin(invitations, eq(invitations.id, participants.invitationId))
      .where(
        and(
          between(invitations.createdAt, from, to),
          isNull(invitations.deletedAt),
        ),
      )
      .groupBy(participants.invitationId)
      .as('sub');
    const [row] = await this.db
      .select({ avg: sql<number>`COALESCE(AVG(${sub.c}), 0)` })
      .from(sub);
    return Number(row?.avg ?? 0);
  }

  // ── 후기(피드백) ─────────────────────────────────────────────────────────

  /** 일별 피드백 작성 추이 (후기 활성도). */
  async feedbacksByDay(from: Date, to: Date): Promise<PeriodCount[]> {
    const dayExpr = sql<string>`to_char(date_trunc('day', ${feedbacks.createdAt} AT TIME ZONE ${sql.raw(KST)}), 'YYYY-MM-DD')`;
    const rows = await this.db
      .select({ period: dayExpr, count: count() })
      .from(feedbacks)
      .where(
        and(between(feedbacks.createdAt, from, to), isNull(feedbacks.deletedAt)),
      )
      .groupBy(dayExpr)
      .orderBy(dayExpr);
    return rows.map((r) => ({ period: r.period, count: Number(r.count) }));
  }

  /** 기간 내 피드백 총수 / 작성 참가자 수. */
  async feedbackStats(
    from: Date,
    to: Date,
  ): Promise<{ total: number; authors: number }> {
    const [row] = await this.db
      .select({
        total: sql<number>`COUNT(*)::int`,
        authors: sql<number>`COUNT(DISTINCT ${feedbacks.participantId})::int`,
      })
      .from(feedbacks)
      .where(
        and(between(feedbacks.createdAt, from, to), isNull(feedbacks.deletedAt)),
      );
    return {
      total: Number(row?.total ?? 0),
      authors: Number(row?.authors ?? 0),
    };
  }
}
