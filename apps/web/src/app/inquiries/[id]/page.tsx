'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopAppBar } from "@wara/ui";
import { Divider } from "@wara/ui";
import { useInquiry, useAnswerInquiry } from '@/hooks/useInquiries';
import type { InquiryType, InquiryStatus, AnswerInquiryInput, Inquiry } from '@/lib/api/inquiries';
import { getUserRole } from '@/lib/jwt';
import { InquiryDetailSkeleton } from '@/components/domain/Skeleton';
import { ROUTES } from '@/constants/routes';

const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  invitation: '초대장',
  photo: '사진',
  notification: '알림',
  mission: '미션',
  bug: '버그 신고',
  feature: '기능 요청',
  general: '기타',
};

const STATUS_CONFIG: Record<InquiryStatus, { label: string; className: string }> = {
  pending:    { label: '답변 대기', className: 'bg-gray-100 text-gray-500' },
  in_progress:{ label: '답변 중',   className: 'bg-blue-100 text-blue-600' },
  resolved:   { label: '답변 완료', className: 'bg-green-50 text-green-600' },
};

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: inquiry, isLoading, refetch } = useInquiry(id);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    setIsAdmin(getUserRole() === 'admin');
  }, []);

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar
        className="shrink-0"
        title="문의 상세"
        onBack={() => router.push(ROUTES.INQUIRIES.ME)}
      />

      <main className="min-h-0 flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <InquiryDetailSkeleton />
        ) : !inquiry ? (
          <p className="py-10 text-center text-[13px] text-text-disabled">
            문의를 찾을 수 없습니다
          </p>
        ) : (
          <>
            {/* ── 게시물 헤더 ── */}
            <div className="px-page pb-5 pt-6">
              {/* 유형 · 상태 · 공개 배지 */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex h-6 items-center rounded-full bg-gray-100 px-2 text-[11px] font-medium text-gray-600">
                  {INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                </span>
                <span
                  className={`inline-flex h-6 items-center rounded-full px-2 text-[11px] font-medium ${STATUS_CONFIG[inquiry.status].className}`}
                >
                  {STATUS_CONFIG[inquiry.status].label}
                </span>
              </div>

              {/* 제목 */}
              <h1 className="text-[18px] font-bold leading-snug text-text">
                {inquiry.title}
              </h1>

              {/* 등록일 */}
              <time
                className="mt-2 block text-[12px] text-text-disabled"
                suppressHydrationWarning
              >
                {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>

            <Divider />

            {/* ── 본문 ── */}
            <div className="px-page py-5">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-text-muted">
                {inquiry.content}
              </p>
            </div>

            {/* ── 답변 ── */}
            {inquiry.answer && (
              <>
                <Divider strength="strong" />
                <div className="bg-blue-50 px-page py-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-blue-700">답변</span>
                    {inquiry.answeredAt && (
                      <time
                        className="text-[11px] text-blue-400"
                        suppressHydrationWarning
                      >
                        {new Date(inquiry.answeredAt).toLocaleDateString('ko-KR')}
                      </time>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-text-muted">
                    {inquiry.answer}
                  </p>
                </div>
              </>
            )}

            {/* ── 관리자 답변 작성 ── */}
            {isAdmin && (
              <>
                <Divider />
                <div className="px-page py-5">
                  {!isAnswering ? (
                    <button
                      onClick={() => setIsAnswering(true)}
                      className="text-[14px] font-medium text-blue-600 hover:text-blue-800"
                    >
                      {inquiry.answer ? '답변 수정' : '답변 작성'}
                    </button>
                  ) : (
                    <AnswerForm
                      inquiry={inquiry}
                      onClose={() => setIsAnswering(false)}
                      onSuccess={() => { setIsAnswering(false); refetch(); }}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

    </div>
  );
}

function AnswerForm({
  inquiry,
  onClose,
  onSuccess,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { mutate: answer, isPending } = useAnswerInquiry(inquiry.id);
  const [form, setForm] = useState<AnswerInquiryInput>({
    answer: inquiry.answer ?? '',
    status: inquiry.status === 'pending' ? 'in_progress' : inquiry.status,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    answer(form, { onSuccess });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-[14px] font-medium text-text">
        {inquiry.answer ? '답변 수정' : '답변 작성'}
      </p>
      <textarea
        value={form.answer}
        onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
        placeholder="답변을 입력하세요"
        rows={5}
        required
        disabled={isPending}
        className="w-full resize-none rounded-sm border border-border bg-surface px-4 py-3 text-[15px] text-text placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
      <div className="flex items-center gap-2">
        <select
          value={form.status}
          onChange={(e) =>
            setForm((f) => ({ ...f, status: e.target.value as AnswerInquiryInput['status'] }))
          }
          disabled={isPending}
          className="rounded-xs border border-border px-3 py-1.5 text-[14px] disabled:opacity-50"
        >
          <option value="in_progress">답변 중</option>
          <option value="resolved">해결됨</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xs bg-blue-600 px-4 py-1.5 text-[14px] text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="text-[14px] text-text-disabled hover:text-text-muted disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
