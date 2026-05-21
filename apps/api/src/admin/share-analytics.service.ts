import { BadRequestException, Injectable } from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import {
  AnalyticsPeriodDto,
  MAX_ANALYTICS_PERIOD_DAYS,
  MS_PER_DAY,
} from './dto/analytics-period.dto';
import { ShareAnalyticsRepository } from './share-analytics.repository';

const DEFAULT_PERIOD_DAYS = 30;

export type AnalyticsPeriodInfo = {
  from: string;
  to: string;
};

export type ChannelsResponse = {
  period: AnalyticsPeriodInfo;
  totalSends: number;
  byChannel: Array<{
    channel: string;
    sends: number;
    opens: number;
    joins: number;
    openRate: number; // opens / sends
    joinRate: number; // joins / sends
  }>;
};

export type ConversionResponse = {
  period: AnalyticsPeriodInfo;
  funnel: {
    sent: number;
    opened: number;
    openedAuthed: number; // 로그인 상태로 방문한 distinct log
    joined: number;
  };
  rates: {
    openRate: number;          // opened / sent
    authedOpenRate: number;    // openedAuthed / opened
    joinRate: number;          // joined / openedAuthed
    overallConversion: number; // joined / sent
  };
};

export type ViralResponse = {
  period: AnalyticsPeriodInfo;
  hostSends: number;
  guestSends: number;
  unattributedSends: number; // sender ∉ participants
  guestViralRatio: number;   // guestSends / (hostSends + guestSends)
};

export type TimelineResponse = {
  period: AnalyticsPeriodInfo;
  totalOpens: number;
  byHour: Array<{ hour: number; opens: number }>;
};

function resolvePeriod(dto: AnalyticsPeriodDto): {
  from: Date;
  to: Date;
  info: AnalyticsPeriodInfo;
} {
  const now = new Date();
  const to = dto.to ? new Date(dto.to) : now;
  const defaultFrom = new Date(to.getTime() - DEFAULT_PERIOD_DAYS * MS_PER_DAY);
  const from = dto.from ? new Date(dto.from) : defaultFrom;

  // DTO refine은 from·to 둘 다 있을 때만 cap 검증.
  // 한쪽만 지정한 케이스(예: from만)에서도 우회 못 하도록 서비스에서 재검증.
  const diffDays = (to.getTime() - from.getTime()) / MS_PER_DAY;
  if (diffDays > MAX_ANALYTICS_PERIOD_DAYS) {
    throw new BadRequestException(ErrorCode.ANALYTICS_PERIOD_TOO_LONG);
  }

  return {
    from,
    to,
    info: { from: from.toISOString(), to: to.toISOString() },
  };
}

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4));
}

@Injectable()
export class ShareAnalyticsService {
  constructor(private readonly repository: ShareAnalyticsRepository) {}

  async getChannels(dto: AnalyticsPeriodDto): Promise<ChannelsResponse> {
    const { from, to, info } = resolvePeriod(dto);
    const rows = await this.repository.countByChannel(from, to);
    const byChannel = rows.map((r) => ({
      channel: r.channel,
      sends: r.sends,
      opens: r.opens,
      joins: r.joins,
      openRate: safeDivide(r.opens, r.sends),
      joinRate: safeDivide(r.joins, r.sends),
    }));
    const totalSends = byChannel.reduce((sum, r) => sum + r.sends, 0);
    return { period: info, totalSends, byChannel };
  }

  async getConversion(dto: AnalyticsPeriodDto): Promise<ConversionResponse> {
    const { from, to, info } = resolvePeriod(dto);
    const funnel = await this.repository.conversionCounts(from, to);
    return {
      period: info,
      funnel,
      rates: {
        openRate: safeDivide(funnel.opened, funnel.sent),
        authedOpenRate: safeDivide(funnel.openedAuthed, funnel.opened),
        joinRate: safeDivide(funnel.joined, funnel.openedAuthed),
        overallConversion: safeDivide(funnel.joined, funnel.sent),
      },
    };
  }

  async getViral(dto: AnalyticsPeriodDto): Promise<ViralResponse> {
    const { from, to, info } = resolvePeriod(dto);
    const counts = await this.repository.viralCounts(from, to);
    const attributed = counts.hostSends + counts.guestSends;
    return {
      period: info,
      hostSends: counts.hostSends,
      guestSends: counts.guestSends,
      unattributedSends: counts.unattributedSends,
      guestViralRatio: safeDivide(counts.guestSends, attributed),
    };
  }

  async getTimeline(dto: AnalyticsPeriodDto): Promise<TimelineResponse> {
    const { from, to, info } = resolvePeriod(dto);
    const rows = await this.repository.opensByHour(from, to);
    // 0~23시 빈 시간대도 0으로 채워서 FE 차트가 항상 24개 점을 받게
    const byHour: Array<{ hour: number; opens: number }> = [];
    const lookup = new Map(rows.map((r) => [r.hour, r.opens]));
    for (let h = 0; h < 24; h++) {
      byHour.push({ hour: h, opens: lookup.get(h) ?? 0 });
    }
    const totalOpens = byHour.reduce((sum, r) => sum + r.opens, 0);
    return { period: info, totalOpens, byHour };
  }
}
