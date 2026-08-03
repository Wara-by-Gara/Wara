export type PeriodInfo = { from: string; to: string };

export type OverviewResponse = {
  period: PeriodInfo;
  totals: { users: number; invitations: number };
  inPeriod: { newUsers: number; invitations: number; sends: number };
  activeUsers: { dau: number; wau: number; mau: number; stickiness: number };
  ops: { pendingInquiries: number; activeBlocklists: number };
};

export type InvitationStatsResponse = {
  period: PeriodInfo;
  summary: {
    invitations: number;
    sends: number;
    avgParticipants: number;
    totalHosts: number;
    repeatHosts: number;
    reHostRatio: number;
  };
  invitationsByDay: Array<{ period: string; count: number }>;
  sendsByDay: Array<{ period: string; count: number }>;
  hostDistribution: Array<{ inviteCount: number; hosts: number }>;
};

export type ChannelsResponse = {
  period: PeriodInfo;
  totalSends: number;
  byChannel: Array<{
    channel: string;
    sends: number;
    opens: number;
    joins: number;
    openRate: number;
    joinRate: number;
  }>;
};

export type ConversionResponse = {
  period: PeriodInfo;
  funnel: { sent: number; opened: number; openedAuthed: number; joined: number };
  rates: {
    openRate: number;
    authedOpenRate: number;
    joinRate: number;
    overallConversion: number;
  };
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
