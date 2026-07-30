'use client';

import { useState } from 'react';
import {
  useChannels,
  useConversion,
  useInvitationStats,
  useOverview,
  useRetention,
} from '@/features/analytics/hooks';

const CHANNEL_LABELS: Record<string, string> = {
  link: '링크 복사',
  kakao: '카카오',
  sms: 'SMS',
  email: '이메일',
  dm: 'DM',
  instagram: '인스타그램',
};

function defaultPeriod() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const def = defaultPeriod();
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

  return (
    <div className="p-8 max-w-7xl">
      {/* 기간 필터 */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-lg font-semibold text-gray-900 mr-4">대시보드</h1>
        <input
          type="date"
          value={form.from}
          onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700"
        />
        <span className="text-gray-400 text-sm">~</span>
        <input
          type="date"
          value={form.to}
          onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700"
        />
        <button
          onClick={handleApply}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          적용
        </button>
      </div>

      {isLoading && (
        <p className="text-center text-gray-400 py-10">불러오는 중...</p>
      )}

      {!isLoading && (
        <>
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
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
          </div>

          {/* 채널별 발송 상세 */}
          <section className="bg-white rounded-xl border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">채널별 초대 링크 발송</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['채널', '발송 수', '열람 수', '참여 수', 'Open Rate', 'Join Rate'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs text-gray-500 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(channels.data?.byChannel ?? []).map((row) => (
                    <tr key={row.channel} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {CHANNEL_LABELS[row.channel] ?? row.channel}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{num(row.sends)}</td>
                      <td className="px-6 py-3 text-gray-700">{num(row.opens)}</td>
                      <td className="px-6 py-3 text-gray-700">{num(row.joins)}</td>
                      <td className="px-6 py-3 text-gray-700">{pct(row.openRate)}</td>
                      <td className="px-6 py-3 text-gray-700">{pct(row.joinRate)}</td>
                    </tr>
                  ))}
                  {(channels.data?.byChannel ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        데이터 없음
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 리텐션 코호트 */}
          <section className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                사용자 재방문율 (8주 코호트)
              </h2>
            </div>
            {retention.isLoading && (
              <p className="text-center text-gray-400 py-8">불러오는 중...</p>
            )}
            {!retention.isLoading && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium whitespace-nowrap">
                        코호트 주
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">
                        크기
                      </th>
                      {Array.from({ length: retention.data?.maxOffset ?? 0 + 1 }, (_, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-left text-xs text-gray-500 font-medium"
                        >
                          W+{i}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(retention.data?.cohorts ?? []).map((cohort) => {
                      const byOffset = new Map(
                        cohort.weeks.map((w) => [w.offset, w.rate]),
                      );
                      return (
                        <tr key={cohort.cohortWeek} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {cohort.cohortWeek}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{num(cohort.size)}</td>
                          {Array.from(
                            { length: (retention.data?.maxOffset ?? 0) + 1 },
                            (_, i) => {
                              const rate = byOffset.get(i);
                              return (
                                <td key={i} className="px-4 py-3 text-gray-700">
                                  {rate !== undefined ? pct(rate) : '—'}
                                </td>
                              );
                            },
                          )}
                        </tr>
                      );
                    })}
                    {(retention.data?.cohorts ?? []).length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-gray-400">
                          데이터 없음
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
