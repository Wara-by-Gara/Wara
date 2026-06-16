'use client';

import { useRouter } from 'next/navigation';
import { TopAppBar } from "@wara/ui";
import { MenuItem } from "@wara/ui";
import { Icon } from '@/components/icons';
import { useAdminInquiries } from '@/hooks/useInquiries';
import { InquiryListSkeleton } from '@/components/organisms/Skeleton';
import { ROUTES } from '@/constants/routes';
import type { InquiryType, InquiryStatus } from '@/lib/api/inquiries';

const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  invitation: '초대장',
  photo: '사진',
  notification: '알림',
  mission: '미션',
  bug: '버그 신고',
  feature: '기능 요청',
  general: '기타',
};

const STATUS_LABELS: Record<InquiryStatus, { label: string; className: string }> = {
  pending:     { label: '답변 대기', className: 'bg-gray-100 text-gray-500' },
  in_progress: { label: '답변 중',   className: 'bg-blue-100 text-blue-600' },
  resolved:    { label: '답변 완료', className: 'bg-green-100 text-green-600' },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col py-2">
    <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-disabled">
      {title}
    </h2>
    <div className="divide-y divide-border bg-surface">{children}</div>
  </section>
);

export default function AdminInquiriesPage() {
  const router = useRouter();
  const { data, isLoading } = useAdminInquiries();

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-surface-muted">
      <TopAppBar
        className="shrink-0"
        title="문의 관리"
        onBack={() => router.push(ROUTES.INQUIRIES.HOME)}
      />

      <main className="min-h-0 flex-1 overflow-y-auto pb-24">
        <Section title={`전체 문의${data ? ` (${data.total})` : ''}`}>
          {isLoading && <InquiryListSkeleton count={5} />}
          {!isLoading && !data?.items.length && (
            <p className="px-4 py-3 text-[14px] text-text-disabled">문의 내역이 없습니다</p>
          )}
          {data?.items.map((inquiry) => {
            const status = STATUS_LABELS[inquiry.status];
            return (
              <MenuItem
                key={inquiry.id}
                rightSlot={
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                    <Icon name="chevron-right" size="sm" color="inactive" decorative />
                  </div>
                }
                onClick={() => router.push(ROUTES.ADMIN.INQUIRY_DETAIL(inquiry.id))}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-text-disabled">
                    {INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                  </span>
                  <span className="text-[15px] text-text">{inquiry.title}</span>
                </div>
              </MenuItem>
            );
          })}
        </Section>
      </main>

    </div>
  );
}
