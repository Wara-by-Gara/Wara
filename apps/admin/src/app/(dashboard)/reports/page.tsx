'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useReports, useHideReport, useRestoreReport, useUpdateReport } from '@/features/reports/hooks';
import type { AdminReport, ReportStatus } from '@/features/reports/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_TABS: { label: string; value: ReportStatus | undefined }[] = [
  { label: '전체', value: undefined },
  { label: '대기', value: 'pending' },
  { label: '검토중', value: 'reviewing' },
  { label: '처리완료', value: 'resolved' },
  { label: '기각', value: 'dismissed' },
];

const STATUS_BADGE: Record<ReportStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  reviewing: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  resolved: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  dismissed: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: '대기',
  reviewing: '검토중',
  resolved: '처리완료',
  dismissed: '기각',
};

const TARGET_BADGE: Record<string, string> = {
  photo: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
  feedback: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR');
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((_, j) => (
            <TableCell key={j}>
              <div className="h-3.5 w-16 rounded bg-muted animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function ExpandedRow({ report, onClose }: { report: AdminReport; onClose: () => void }) {
  const [memo, setMemo] = useState(report.adminMemo ?? '');
  const hide = useHideReport();
  const restore = useRestoreReport();
  const update = useUpdateReport();

  const isPending = hide.isPending || restore.isPending || update.isPending;

  async function handleSaveMemo() {
    await update.mutateAsync({ id: report.id, adminMemo: memo });
    onClose();
  }

  async function handleHide() {
    await hide.mutateAsync(report.id);
    onClose();
  }

  async function handleRestore() {
    await restore.mutateAsync(report.id);
    onClose();
  }

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={6} className="py-3 px-6">
        <div className="flex flex-col gap-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">신고 ID:</span> {report.id}
          </div>
          {report.reason && (
            <div className="text-xs">
              <span className="font-medium text-foreground">신고 사유:</span>{' '}
              <span className="text-muted-foreground">{report.reason}</span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">관리자 메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="메모 입력"
              className="w-full max-w-lg px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex gap-2">
            {report.status !== 'resolved' && (
              <Button size="sm" variant="destructive" onClick={handleHide} disabled={isPending}>
                콘텐츠 숨김 + 처리완료
              </Button>
            )}
            {report.status !== 'dismissed' && (
              <Button size="sm" variant="outline" onClick={handleRestore} disabled={isPending}>
                복원 + 기각
              </Button>
            )}
            <Button size="sm" onClick={handleSaveMemo} disabled={isPending}>
              메모 저장
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ReportsPage() {
  const [status, setStatus] = useState<ReportStatus | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useReports(status);

  function handleStatusChange(val: ReportStatus | undefined) {
    setStatus(val);
    setExpandedId(null);
  }

  return (
    <div className="py-6 px-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">신고 처리</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              총 <span className="font-semibold text-foreground">{data?.length ?? '—'}</span>건
            </p>
          </div>
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={String(tab.value)}
                onClick={() => handleStatusChange(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  status === tab.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 테이블 */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">대상 유형</TableHead>
                <TableHead className="font-semibold">대상 ID</TableHead>
                <TableHead className="font-semibold">신고 사유</TableHead>
                <TableHead className="font-semibold">상태</TableHead>
                <TableHead className="font-semibold">신고일</TableHead>
                <TableHead className="font-semibold">메모</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Flag className="w-8 h-8 opacity-30" />
                      <span className="text-sm">신고가 없습니다.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((report) => (
                  <>
                    <TableRow
                      key={report.id}
                      onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <Badge className={TARGET_BADGE[report.targetType] ?? 'bg-gray-100 text-gray-600'}>
                          {report.targetType === 'photo' ? '사진' : '댓글'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {report.targetId.slice(0, 12)}…
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {report.reason ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[report.status]}>
                          {STATUS_LABEL[report.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDate(report.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[8rem] truncate">
                        {report.adminMemo ?? '-'}
                      </TableCell>
                    </TableRow>
                    {expandedId === report.id && (
                      <ExpandedRow
                        key={`${report.id}-expanded`}
                        report={report}
                        onClose={() => setExpandedId(null)}
                      />
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
