'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopAppBar } from "@wara/ui";
import { ConfirmDialog } from "@wara/ui";
import { IconButton } from "@wara/ui";
import { useMyInquiries, useDeleteInquiry } from '@/hooks/useInquiries';
import { useAuthStore } from '@/stores/authStore';
import { InquiryListSkeleton } from '@/components/domain/Skeleton';
import { ROUTES } from '@/constants/routes';
import type { Inquiry, InquiryType, InquiryStatus } from '@/lib/api/inquiries';

const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  invitation: '초대장',
  photo: '사진',
  mission: '미션',
  notification: '알림',
  bug: '버그 신고',
  feature: '기능 요청',
  general: '기타',
};

const STATUS_LABELS: Record<InquiryStatus, { label: string; className: string }> = {
  pending: { label: '답변 대기', className: 'bg-gray-100 text-gray-500' },
  in_progress: { label: '답변 중', className: 'bg-blue-100 text-blue-600' },
  resolved: { label: '답변 완료', className: 'bg-green-100 text-green-600' },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col py-2">
    <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-disabled">
      {title}
    </h2>
    <div className="divide-y divide-border bg-surface">{children}</div>
  </section>
);

export default function MyInquiriesPage() {
  const router = useRouter();
  const { isLoggedIn, hydrated } = useAuthStore();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data, isLoading } = useMyInquiries();
  const { mutate: remove } = useDeleteInquiry();

  // 비로그인 시 고객센터 홈으로
  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      router.push(ROUTES.INQUIRIES.HOME);
    }
  }, [hydrated, isLoggedIn, router]);

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col bg-surface-muted">
      <TopAppBar
        className="shrink-0"
        title="나의 문의"
        onBack={() => router.push(ROUTES.INQUIRIES.HOME)}
      />

      <main className="min-h-0 flex-1 overflow-y-auto pb-24">
        <Section title="나의 문의">
          {isLoading ? (
            <InquiryListSkeleton count={5} />
          ) : !data?.items.length ? (
            <p className="py-6 text-center text-[13px] text-text-disabled">
              문의 내역이 없습니다
            </p>
          ) : (
            // TODO(human): 아래 InquiryCard의 레이아웃을 직접 구현해보세요.
            // 현재는 기본 카드가 제공됩니다. 원하는 방식으로 수정해도 좋아요.
            data.items.map((inquiry: Inquiry) => (
              <InquiryCard
                key={inquiry.id}
                inquiry={inquiry}
                onNavigate={() => router.push(ROUTES.INQUIRIES.DETAIL(inquiry.id))}
                onDelete={() => setDeleteTargetId(inquiry.id)}
              />
            ))
          )}
        </Section>
      </main>

      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="문의를 삭제하시겠습니까?"
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (deleteTargetId) {
            remove(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
      />

    </div>
  );
}

function InquiryCard({
  inquiry,
  onNavigate,
  onDelete,
}: {
  inquiry: Inquiry;
  onNavigate: () => void;
  onDelete: () => void;
}) {
  const status = STATUS_LABELS[inquiry.status];
  const typeLabel = INQUIRY_TYPE_LABELS[inquiry.inquiryType];

  return (
    <div className="flex min-h-[64px] items-center gap-3 bg-surface px-4 py-3">
      {/* 클릭 영역 — 상세 페이지로 이동 */}
      <button className="flex-1 text-left" onClick={onNavigate}>
        <div className="flex flex-col gap-1">
          {/* 유형 + 상태 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-text-disabled">{typeLabel}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${status.className}`}
            >
              {status.label}
            </span>
          </div>
          {/* 제목 */}
          <p className="line-clamp-1 text-[15px] font-semibold text-text">
            {inquiry.title}
          </p>
          {/* 날짜 */}
          <time
            className="text-[12px] text-text-disabled"
            suppressHydrationWarning
          >
            {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
          </time>
        </div>
      </button>

      {/* 우측 액션 */}
      <div className="flex shrink-0 items-center gap-2">
        {inquiry.status === 'pending' && (
          <IconButton
            icon="trash"
            variant="danger"
            size="sm"
            label="문의 삭제"
            onClick={onDelete}
          />
        )}
      </div>
    </div>
  );
}
