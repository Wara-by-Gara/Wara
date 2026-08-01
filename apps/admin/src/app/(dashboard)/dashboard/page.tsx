'use client';

import { useState } from 'react';
import {
  useChannels,
  useConversion,
  useInvitationStats,
  useOverview,
  useRetention,
} from '@/features/analytics/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CHANNEL_LABELS: Record<string, string> = {
  link: '링크 복사',
  kakao: '카카오',
  sms: 'SMS',
  email: '이메일',
  dm: 'DM',
  instagram: '인스타그램',
};

const PRESETS = [
  { label: '7일', days: 7 },
  { label: '30일', days: 30 },
  { label: '90일', days: 90 },
];

function defaultPeriod(days = 30) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function toISO(dateStr: string, end = false) {
  return end ? `${dateStr}T23:59:59+09:00` : `${dateStr}T00:00:00+09:00`;
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function num(value: number) {
  return value.toLocaleString('ko-KR');
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-4 animate-pulse">
      <div className="h-3 w-24 rounded bg-muted mb-2" />
      <div className="h-7 w-20 rounded bg-muted mb-1" />
      <div className="h-2.5 w-28 rounded bg-muted" />
    </div>
  );
}

export default function DashboardPage() {
  const def = defaultPeriod(30);
  const [form, setForm] = useState({ from: def.from, to: def.to });
  const [period, setPeriod] = useState(def);

  const fromISO = toISO(period.from);
  const toISO_ = toISO(period.to, true);

  const overview = useOverview(fromISO, toISO_);
  const invitations = useInvitationStats(fromISO, toISO_);
  const channels = useChannels(fromISO, toISO_);
  const conversion = useConversion(fromISO, toISO_);
  const retention = useRetention(8);

  const isLoading =
    overview.isLoading ||
    invitations.isLoading ||
    channels.isLoading ||
    conversion.isLoading;

  function handleApply() {
    setPeriod({ from: form.from, to: form.to });
  }

  function handlePreset(days: number) {
    const p = defaultPeriod(days);
    setForm(p);
    setPeriod(p);
  }

  return (
    <div className="p-6 max-w-7xl">
      {/* 헤더 + 기간 필터 */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-base font-semibold mr-2">대시보드</h1>
        <div className="flex items-center gap-1">
          {PRESETS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => handlePreset(days)}
              className="px-2.5 py-1 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          <Input
            type="date"
            value={form.from}
            onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
            className="h-8 text-sm w-36"
          />
          <span className="text-muted-foreground text-sm">~</span>
          <Input
            type="date"
            value={form.to}
            onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
            className="h-8 text-sm w-36"
          />
          <Button size="sm" onClick={handleApply} className="h-8">
            적용
          </Button>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="MAU (최근 30일 활성)"
              value={num(overview.data?.activeUsers.mau ?? 0)}
            />
            <KpiCard
              label="WAU (최근 7일 활성)"
              value={num(overview.data?.activeUsers.wau ?? 0)}
            />
            <KpiCard
              label="모임 생성 건수"
              value={num(invitations.data?.summary.invitations ?? 0)}
              sub="기간 내 초대장 생성"
            />
            <KpiCard
              label="초대 링크 발송 수"
              value={num(channels.data?.totalSends ?? 0)}
            />
            <KpiCard
              label="초대 참여 전환율"
              value={pct(conversion.data?.rates.overallConversion ?? 0)}
              sub="발송 → 참여"
            />
            <KpiCard
              label="모임 재개설 비율"
              value={pct(invitations.data?.summary.reHostRatio ?? 0)}
              sub={`반복 호스트 ${num(invitations.data?.summary.repeatHosts ?? 0)}명`}
            />
            <KpiCard
              label="평균 참가자 수"
              value={(invitations.data?.summary.avgParticipants ?? 0).toFixed(1) + '명'}
              sub="모임당"
            />
            <KpiCard
              label="DAU Stickiness"
              value={pct(overview.data?.activeUsers.stickiness ?? 0)}
              sub="DAU / MAU"
            />
          </>
        )}
      </div>

      {/* 채널별 발송 상세 */}
      <section className="bg-card rounded-xl border mb-6">
        <div className="px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">채널별 초대 링크 발송</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {['채널', '발송 수', '열람 수', '참여 수', 'Open Rate', 'Join Rate'].map((h) => (
                <TableHead key={h} className="text-xs">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-3.5 w-16 rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (channels.data?.byChannel ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  데이터 없음
                </TableCell>
              </TableRow>
            ) : (
              (channels.data?.byChannel ?? []).map((row) => (
                <TableRow key={row.channel}>
                  <TableCell className="font-medium">{CHANNEL_LABELS[row.channel] ?? row.channel}</TableCell>
                  <TableCell className="tabular-nums">{num(row.sends)}</TableCell>
                  <TableCell className="tabular-nums">{num(row.opens)}</TableCell>
                  <TableCell className="tabular-nums">{num(row.joins)}</TableCell>
                  <TableCell className="tabular-nums">{pct(row.openRate)}</TableCell>
                  <TableCell className="tabular-nums">{pct(row.joinRate)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {/* 리텐션 코호트 */}
      <section className="bg-card rounded-xl border">
        <div className="px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">사용자 재방문율 (8주 코호트)</h2>
        </div>
        {retention.isLoading ? (
          <div className="px-5 py-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3.5 rounded bg-muted animate-pulse" style={{ width: `${80 - i * 8}%` }} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs whitespace-nowrap">코호트 주</TableHead>
                  <TableHead className="text-xs">크기</TableHead>
                  {Array.from({ length: retention.data?.maxOffset ?? 0 + 1 }, (_, i) => (
                    <TableHead key={i} className="text-xs">W+{i}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(retention.data?.cohorts ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                      데이터 없음
                    </TableCell>
                  </TableRow>
                ) : (
                  (retention.data?.cohorts ?? []).map((cohort) => {
                    const byOffset = new Map(cohort.weeks.map((w) => [w.offset, w.rate]));
                    return (
                      <TableRow key={cohort.cohortWeek}>
                        <TableCell className="whitespace-nowrap text-sm">{cohort.cohortWeek}</TableCell>
                        <TableCell className="tabular-nums text-sm">{num(cohort.size)}</TableCell>
                        {Array.from({ length: (retention.data?.maxOffset ?? 0) + 1 }, (_, i) => {
                          const rate = byOffset.get(i);
                          return (
                            <TableCell key={i} className="tabular-nums text-sm">
                              {rate !== undefined ? pct(rate) : '—'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
