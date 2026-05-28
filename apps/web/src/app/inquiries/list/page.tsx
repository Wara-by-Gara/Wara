'use client';

import { useRouter } from 'next/navigation';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { usePublicInquiries } from '@/hooks/useInquiries';
import { ROUTES } from '@/constants/routes';
import type { InquiryType, InquiryStatus, PublicInquiry } from '@/lib/api/inquiries';

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
  pending: { label: '답변 대기', className: 'bg-gray-100 text-gray-600' },
  in_progress: { label: '답변 중', className: 'bg-blue-100 text-blue-600' },
  resolved: { label: '답변 완료', className: 'bg-green-100 text-green-600' },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col py-2">
    <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-tertiary">
      {title}
    </h2>
    <div className="divide-y divide-border bg-surface">{children}</div>
  </section>
);

export default function InquiryListPage() {
  const router = useRouter();
  const { data, isLoading } = usePublicInquiries();

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar
        className="shrink-0"
        title="전체 문의"
        onBack={() => router.push(ROUTES.INQUIRIES.HOME)}
      />

      <main className="min-h-0 flex-1 overflow-y-auto pb-24">
        <Section title={`전체 문의 ${data ? `(${data.total}건)` : ''}`}>
          {isLoading ? (
            <p className="py-6 text-center text-[13px] text-text-tertiary">불러오는 중...</p>
          ) : !data?.items.length ? (
            <p className="py-6 text-center text-[13px] text-text-tertiary">
              접수된 문의가 없습니다
            </p>
          ) : (
            data.items.map((inquiry: PublicInquiry) => {
              const status = STATUS_LABELS[inquiry.status];
              return (
                <button
                  key={inquiry.id}
                  type="button"
                  onClick={() => router.push(ROUTES.INQUIRIES.DETAIL(inquiry.id))}
                  className="flex w-full flex-col gap-1 px-4 py-4 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] text-text-tertiary">
                      {INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                    </span>
                    <span className="text-[12px] text-text-tertiary">
                      {inquiry.authorNickname ?? '익명'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="truncate text-[15px] font-semibold text-text-primary">
                    {inquiry.title}
                  </p>
                  <p className="line-clamp-2 text-[13px] text-text-secondary">
                    {inquiry.content}
                  </p>
                  <time
                    suppressHydrationWarning
                    className="mt-1 text-[12px] text-text-tertiary"
                  >
                    {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                  </time>
                </button>
              );
            })
          )}
        </Section>
      </main>

    </div>
  );
}
