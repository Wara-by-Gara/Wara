'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { MainBottomNav } from '@/components/layout/MainBottomNav';
import { FormField } from '@/components/molecules/FormField';
import { TextInput } from '@/components/primitives/TextInput';
import { Textarea } from '@/components/primitives/Textarea';
import { Button } from '@/components/primitives/Button';
import { Chip } from '@/components/primitives/Chip';
import { Switch } from '@/components/primitives/Switch';
import { ConfirmModal } from '@/components/molecules/Modal';
import {
  useMyInquiries,
  useCreateInquiry,
  useDeleteInquiry,
  usePublicInquiries,
} from '@/hooks/useInquiries';
import { useAuthStore } from '@/stores/authStore';
import type {
  InquiryType,
  InquiryStatus,
  PublicInquiry,
} from '@/lib/api/inquiries';

const INQUIRY_TYPES: { value: InquiryType; label: string }[] = [
  { value: 'invitation', label: '초대장' },
  { value: 'photo', label: '사진' },
  { value: 'mission', label: '미션' },
  { value: 'notification', label: '알림' },
  { value: 'bug', label: '버그 신고' },
  { value: 'feature', label: '기능 요청' },
  { value: 'general', label: '기타' },
];

const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = Object.fromEntries(
  INQUIRY_TYPES.map(({ value, label }) => [value, label]),
) as Record<InquiryType, string>;

const STATUS_LABELS: Record<
  InquiryStatus,
  { label: string; className: string }
> = {
  pending: { label: '답변 대기', className: 'bg-gray-100 text-gray-600' },
  in_progress: { label: '답변 중', className: 'bg-blue-100 text-blue-600' },
  resolved: { label: '답변 완료', className: 'bg-green-100 text-green-600' },
};

export default function InquiriesPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  const [showForm, setShowForm] = useState(false);
  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({
    inquiryType: 'general' as InquiryType,
    title: '',
    content: '',
    isPublic: true,
  });

  const { data, isLoading } = useMyInquiries();
  const { data: publicData, isLoading: isPublicLoading } = usePublicInquiries();
  const { mutate: create, isPending: isCreating } = useCreateInquiry();
  const { mutate: remove } = useDeleteInquiry();

  function handleSubmit() {
    if (!isLoggedIn) {
      setSubmitError('로그인 후 문의를 보낼 수 있습니다');
      return;
    }
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitError('');
    create(form, {
      onSuccess: () => {
        setDoneModalOpen(true);
        setForm({
          inquiryType: 'general',
          title: '',
          content: '',
          isPublic: true,
        });
      },
      onError: () => setSubmitError('문의 제출 중 오류가 발생했습니다'),
    });
  }

  // ── 문의 작성 화면 ──────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col bg-background">
        <TopAppBar
          className="shrink-0"
          title="문의하기"
          onBack={() => setShowForm(false)}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
          {/* 문의 유형 */}
          <FormField label="문의 유형" required>
            <div className="flex flex-wrap gap-2 pt-1">
              {INQUIRY_TYPES.map((type) => (
                <Chip
                  key={type.value}
                  variant="selectable"
                  selected={form.inquiryType === type.value}
                  disabled={isCreating}
                  onClick={() =>
                    setForm((f) => ({ ...f, inquiryType: type.value }))
                  }
                >
                  {type.label}
                </Chip>
              ))}
            </div>
          </FormField>

          {/* 제목 */}
          <FormField label="제목" required>
            <TextInput
              placeholder="제목을 입력해주세요"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              maxLength={200}
              disabled={isCreating}
            />
          </FormField>

          {/* 문의 내용 */}
          <FormField label="문의 내용" required>
            <Textarea
              rows={6}
              placeholder="내용을 입력해주세요. 빠른 답변을 위해 가능한 자세히 작성해주세요."
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              maxLength={1000}
              disabled={isCreating}
            />
          </FormField>

          {/* 공개 여부 */}
          <label className="flex cursor-pointer items-center gap-3">
            <Switch
              checked={form.isPublic}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isPublic: v }))}
              disabled={isCreating}
            />
            <span className="text-[15px] text-text-primary">
              {form.isPublic ? '공개' : '비공개'}
            </span>
          </label>

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        </main>

        <footer className="px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isCreating}
            onClick={handleSubmit}
          >
            보내기
          </Button>
        </footer>

        {/* 접수 완료 모달 */}
        <ConfirmModal
          open={doneModalOpen}
          onOpenChange={setDoneModalOpen}
          title="문의가 접수됐어요"
          description="빠른 시일 내 답변드릴게요"
          confirmLabel="확인"
          onConfirm={() => {
            setDoneModalOpen(false);
            setShowForm(false);
          }}
        />

        <MainBottomNav activeKey="me" />
      </div>
    );
  }

  // ── 문의 목록 화면 ──────────────────────────────────────────────────────────
  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col bg-background-soft">
      <TopAppBar
        className="shrink-0"
        title="문의하기"
        rightSlot={
          <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
            작성
          </Button>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto pb-24">
        {/* 나의 문의 — 로그인한 경우만 표시 */}
        {isLoggedIn && (
          <section className="px-5 py-4">
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-text-tertiary">
              나의 문의
            </h2>
            {isLoading ? (
              <p className="py-6 text-center text-gray-400">불러오는 중...</p>
            ) : !data?.items.length ? (
              <p className="py-6 text-center text-gray-400">
                문의 내역이 없습니다
              </p>
            ) : (
              <ul className="space-y-2">
                {data.items.map((inquiry) => {
                  const status = STATUS_LABELS[inquiry.status];
                  return (
                    <li
                      key={inquiry.id}
                      className="rounded-2xl border border-border bg-surface p-4"
                    >
                      <Link href={`/inquiries/${inquiry.id}`} className="block">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-[12px] text-text-tertiary">
                            {INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="truncate text-[15px] font-medium text-text-primary">
                          {inquiry.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[13px] text-text-secondary">
                          {inquiry.content}
                        </p>
                      </Link>
                      <div className="mt-3 flex items-center justify-between">
                        <time
                          suppressHydrationWarning
                          className="text-[12px] text-text-tertiary"
                        >
                          {new Date(inquiry.createdAt).toLocaleDateString(
                            'ko-KR',
                          )}
                        </time>
                        {inquiry.status === 'pending' && (
                          <button
                            onClick={() => setDeleteTargetId(inquiry.id)}
                            className="text-[13px] text-text-tertiary hover:text-danger transition-colors"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* 전체 공개 문의 */}
        <section className="px-5 py-4">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-text-tertiary">
            전체 문의
          </h2>
          {isPublicLoading ? (
            <p className="py-6 text-center text-gray-400">불러오는 중...</p>
          ) : !publicData?.items.length ? (
            <p className="py-6 text-center text-gray-400">
              공개된 문의가 없습니다
            </p>
          ) : (
            <ul className="space-y-2">
              {publicData.items.map((inquiry: PublicInquiry) => {
                const status = STATUS_LABELS[inquiry.status];
                return (
                  <li
                    key={inquiry.id}
                    onClick={() => router.push(`/inquiries/${inquiry.id}`)}
                    className="cursor-pointer rounded-2xl border border-border bg-surface p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-[12px] text-text-tertiary">
                        {INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                      </span>
                      <span className="text-[12px] text-text-tertiary">
                        by {inquiry.authorNickname ?? '익명'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="truncate text-[15px] font-medium text-text-primary">
                      {inquiry.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] text-text-secondary">
                      {inquiry.content}
                    </p>
                    <time
                      suppressHydrationWarning
                      className="mt-3 block text-[12px] text-text-tertiary"
                    >
                      {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="문의를 삭제하시겠습니까?"
        confirmLabel="삭제"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteTargetId) {
            remove(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
      />

      <MainBottomNav activeKey="me" />
    </div>
  );
}
