import { BadRequestException, Injectable } from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import {
  AnalyticsPeriodDto,
  MAX_ANALYTICS_PERIOD_DAYS,
  MS_PER_DAY,
} from './dto/analytics-period.dto';
import {
  DashboardRepository,
  LabelCount,
  PeriodCount,
} from './dashboard.repository';

const DEFAULT_PERIOD_DAYS = 30;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const DEFAULT_RETENTION_WEEKS = 8;

type ResolvedPeriod = {
  from: Date;
  to: Date;
  info: { from: string; to: string };
};

function resolvePeriod(dto: AnalyticsPeriodDto): ResolvedPeriod {
  const now = new Date();
  const to = dto.to ? new Date(dto.to) : now;
  const defaultFrom = new Date(to.getTime() - DEFAULT_PERIOD_DAYS * MS_PER_DAY);
  const from = dto.from ? new Date(dto.from) : defaultFrom;

  const diffDays = (to.getTime() - from.getTime()) / MS_PER_DAY;
  if (diffDays > MAX_ANALYTICS_PERIOD_DAYS) {
    throw new BadRequestException(ErrorCode.ANALYTICS_PERIOD_TOO_LONG);
  }

  return { from, to, info: { from: from.toISOString(), to: to.toISOString() } };
}

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4));
}

export type OverviewResponse = {
  period: { from: string; to: string };
  totals: { users: number; invitations: number };
  inPeriod: { newUsers: number; invitations: number; sends: number };
  activeUsers: {
    dau: number;
    wau: number;
    mau: number;
    stickiness: number; // dau / mau
  };
  ops: { pendingInquiries: number; activeBlocklists: number };
};

export type ActiveUsersResponse = {
  period: { from: string; to: string };
  current: { dau: number; wau: number; mau: number; stickiness: number };
  daily: PeriodCount[];
  weekly: PeriodCount[];
  monthly: PeriodCount[];
};

export type RetentionResponse = {
  weeks: number;
  maxOffset: number;
  cohorts: Array<{
    cohortWeek: string;
    size: number;
    weeks: Array<{ offset: number; users: number; rate: number }>;
  }>;
};

export type GrowthResponse = {
  period: { from: string; to: string };
  summary: { newUsers: number; withdrawals: number };
  newUsersByDay: PeriodCount[];
  byProvider: LabelCount[];
  withdrawalsByDay: PeriodCount[];
  withdrawalReasons: LabelCount[];
};

export type InvitationStatsResponse = {
  period: { from: string; to: string };
  summary: {
    invitations: number;
    sends: number;
    avgParticipants: number;
    totalHosts: number;
    repeatHosts: number;
    reHostRatio: number; // repeatHosts / totalHosts
  };
  invitationsByDay: PeriodCount[];
  sendsByDay: PeriodCount[];
  hostDistribution: Array<{ inviteCount: number; hosts: number }>;
};

export type FeedbackResponse = {
  period: { from: string; to: string };
  summary: { total: number; authors: number };
  byDay: PeriodCount[];
};

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getOverview(dto: AnalyticsPeriodDto): Promise<OverviewResponse> {
    const { from, to, info } = resolvePeriod(dto);
    const now = Date.now();
    const [
      totalUsers,
      totalInvitations,
      newUsers,
      invitations,
      sends,
      dau,
      wau,
      mau,
      pendingInquiries,
      activeBlocklists,
    ] = await Promise.all([
      this.repository.totalUsers(),
      this.repository.totalInvitations(),
      this.repository.newUserCount(from, to),
      this.repository.invitationCount(from, to),
      this.repository.sendCount(from, to),
      this.repository.activeUserCount(new Date(now - MS_PER_DAY)),
      this.repository.activeUserCount(new Date(now - MS_PER_WEEK)),
      this.repository.activeUserCount(new Date(now - 30 * MS_PER_DAY)),
      this.repository.pendingInquiryCount(),
      this.repository.activeBlocklistCount(),
    ]);

    return {
      period: info,
      totals: { users: totalUsers, invitations: totalInvitations },
      inPeriod: { newUsers, invitations, sends },
      activeUsers: { dau, wau, mau, stickiness: safeDivide(dau, mau) },
      ops: { pendingInquiries, activeBlocklists },
    };
  }

  async getActiveUsers(dto: AnalyticsPeriodDto): Promise<ActiveUsersResponse> {
    const { from, to, info } = resolvePeriod(dto);
    const now = Date.now();
    const [daily, weekly, monthly, dau, wau, mau] = await Promise.all([
      this.repository.activeUsersByBucket(from, to, 'day'),
      this.repository.activeUsersByBucket(from, to, 'week'),
      this.repository.activeUsersByBucket(from, to, 'month'),
      this.repository.activeUserCount(new Date(now - MS_PER_DAY)),
      this.repository.activeUserCount(new Date(now - MS_PER_WEEK)),
      this.repository.activeUserCount(new Date(now - 30 * MS_PER_DAY)),
    ]);

    return {
      period: info,
      current: { dau, wau, mau, stickiness: safeDivide(dau, mau) },
      daily,
      weekly,
      monthly,
    };
  }

  async getRetention(weeks?: number): Promise<RetentionResponse> {
    const cohortWeeks = weeks ?? DEFAULT_RETENTION_WEEKS;
    const cohortStart = new Date(Date.now() - cohortWeeks * MS_PER_WEEK);
    const [rows, sizes] = await Promise.all([
      this.repository.retentionCohorts(cohortStart),
      this.repository.cohortSizes(cohortStart),
    ]);

    const sizeByCohort = new Map(sizes.map((s) => [s.period, s.count]));
    const byCohort = new Map<
      string,
      Array<{ offset: number; users: number }>
    >();
    let maxOffset = 0;
    for (const r of rows) {
      maxOffset = Math.max(maxOffset, r.weekOffset);
      const list = byCohort.get(r.cohortWeek) ?? [];
      list.push({ offset: r.weekOffset, users: r.users });
      byCohort.set(r.cohortWeek, list);
    }

    const cohorts = sizes.map((s) => {
      const size = sizeByCohort.get(s.period) ?? 0;
      const offsets = byCohort.get(s.period) ?? [];
      return {
        cohortWeek: s.period,
        size,
        weeks: offsets.map((o) => ({
          offset: o.offset,
          users: o.users,
          rate: safeDivide(o.users, size),
        })),
      };
    });

    return { weeks: cohortWeeks, maxOffset, cohorts };
  }

  async getGrowth(dto: AnalyticsPeriodDto): Promise<GrowthResponse> {
    const { from, to, info } = resolvePeriod(dto);
    const [newUsersByDay, byProvider, withdrawalsByDay, withdrawalReasons] =
      await Promise.all([
        this.repository.newUsersByDay(from, to),
        this.repository.usersByProvider(),
        this.repository.withdrawalsByDay(from, to),
        this.repository.withdrawalReasons(from, to),
      ]);

    const sum = (rows: PeriodCount[]) => rows.reduce((a, r) => a + r.count, 0);
    return {
      period: info,
      summary: {
        newUsers: sum(newUsersByDay),
        withdrawals: sum(withdrawalsByDay),
      },
      newUsersByDay,
      byProvider,
      withdrawalsByDay,
      withdrawalReasons,
    };
  }

  async getInvitationStats(
    dto: AnalyticsPeriodDto,
  ): Promise<InvitationStatsResponse> {
    const { from, to, info } = resolvePeriod(dto);
    const [invitationsByDay, sendsByDay, distribution, avgParticipants] =
      await Promise.all([
        this.repository.invitationsByDay(from, to),
        this.repository.sendsByDay(from, to),
        this.repository.reHostDistribution(),
        this.repository.avgParticipantsPerInvitation(from, to),
      ]);

    const totalHosts = distribution.reduce((a, r) => a + r.hosts, 0);
    const repeatHosts = distribution
      .filter((r) => r.inviteCount >= 2)
      .reduce((a, r) => a + r.hosts, 0);
    const invitations = invitationsByDay.reduce((a, r) => a + r.count, 0);
    const sends = sendsByDay.reduce((a, r) => a + r.count, 0);

    return {
      period: info,
      summary: {
        invitations,
        sends,
        avgParticipants: Number(avgParticipants.toFixed(2)),
        totalHosts,
        repeatHosts,
        reHostRatio: safeDivide(repeatHosts, totalHosts),
      },
      invitationsByDay,
      sendsByDay,
      hostDistribution: distribution,
    };
  }

  async getFeedback(dto: AnalyticsPeriodDto): Promise<FeedbackResponse> {
    const { from, to, info } = resolvePeriod(dto);
    const [byDay, stats] = await Promise.all([
      this.repository.feedbacksByDay(from, to),
      this.repository.feedbackStats(from, to),
    ]);
    return { period: info, summary: stats, byDay };
  }
}
