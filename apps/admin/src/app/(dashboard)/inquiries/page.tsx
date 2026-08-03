'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useInquiries, useAnswerInquiry } from '@/features/inquiries/hooks';
import type { AdminInquiry, InquiryStatus } from '@/features/inquiries/types';
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

const STATUS_TABS: { label: string; value: InquiryStatus | undefined }[] = [
  { label: '전체', value: undefined },
  { label: '대기', value: 'pending' },
  { label: '처리중', value: 'in_progress' },
  { label: '완료', value: 'resolved' },
];

const STATUS_BADGE: Record<InquiryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  in_progress: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  resolved: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
};

const STATUS_LABEL: Record<InquiryStatus, string> = {
  pending: '대기',
  in_progress: '처리중',
  resolved: '완료',
};

const TYPE_LABEL: Record<string, string> = {
  invitation: '초대장',
  photo: '사진',
  notification: '알림',
  mission: '미션',
  bug: '버그',
  feature: '기능 요청',
  general: '기타',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR');
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 5 }).map((_, j) => (
            <TableCell key={j}>
              <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function ExpandedRow({ inquiry, onClose }: { inquiry: AdminInquiry; onClose: () => void }) {
  const [answer, setAnswer] = useState(inquiry.answer ?? '');
  const [resolveStatus, setResolveStatus] = useState<'in_progress' | 'resolved'>('resolved');
  const answerMutation = useAnswerInquiry();

  async function handleSubmit() {
    if (!answer.trim()) return;
    await answerMutation.mutateAsync({ id: inquiry.id, answer, status: resolveStatus });
    onClose();
  }

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={5} className="py-4 px-6">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">문의 내용</p>
            <p className="text-sm whitespace-pre-wrap">{inquiry.content}</p>
          </div>
          {inquiry.answer && (
            <div className="rounded-lg border bg-emerald-50 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-emerald-700">기존 답변</p>
                {inquiry.adminNickname && (
                  <p className="text-xs text-emerald-600">답변자: {inquiry.adminNickname}</p>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap text-emerald-900">{inquiry.answer}</p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">답변 작성</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              placeholder="답변을 입력하세요"
              className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={resolveStatus}
              onChange={(e) => setResolveStatus(e.target.value as 'in_progress' | 'resolved')}
              className="text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="in_progress">처리중으로 변경</option>
              <option value="resolved">완료로 변경</option>
            </select>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={answerMutation.isPending || !answer.trim()}
            >
              {answerMutation.isPending ? '저장 중...' : '답변 저장'}
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

export default function InquiriesPage() {
  const [status, setStatus] = useState<InquiryStatus | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useInquiries();

  const filtered = status ? data?.filter((i) => i.status === status) : data;

  return (
    <div className="py-6 px-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">문의 관리</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              총 <span className="font-semibold text-foreground">{filtered?.length ?? '—'}</span>건
            </p>
          </div>
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={String(tab.value)}
                onClick={() => { setStatus(tab.value); setExpandedId(null); }}
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

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">유형</TableHead>
                <TableHead className="font-semibold">제목</TableHead>
                <TableHead className="font-semibold">상태</TableHead>
                <TableHead className="font-semibold">공개</TableHead>
                <TableHead className="font-semibold">접수일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : !filtered?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 opacity-30" />
                      <span className="text-sm">문의가 없습니다.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inquiry) => (
                  <>
                    <TableRow
                      key={inquiry.id}
                      onClick={() => setExpandedId(expandedId === inquiry.id ? null : inquiry.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABEL[inquiry.inquiryType] ?? inquiry.inquiryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {inquiry.title}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[inquiry.status]}>
                          {STATUS_LABEL[inquiry.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {inquiry.isPublic ? '공개' : '비공개'}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDate(inquiry.createdAt)}
                      </TableCell>
                    </TableRow>
                    {expandedId === inquiry.id && (
                      <ExpandedRow
                        key={`${inquiry.id}-expanded`}
                        inquiry={inquiry}
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
