'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopAppBar } from "@wara/ui";
import { FormField } from "@wara/ui";
import { Input } from "@wara/ui";
import { Textarea } from "@wara/ui";
import { Button } from "@wara/ui";
import { Chip } from "@wara/ui";
import { ConfirmDialog } from "@wara/ui";
import { useCreateInquiry } from '@/hooks/useInquiries';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import type { InquiryType } from '@/lib/api/inquiries';

const INQUIRY_TYPES: { value: InquiryType; label: string }[] = [
  { value: 'invitation', label: '초대장' },
  { value: 'photo', label: '사진' },
  { value: 'mission', label: '미션' },
  { value: 'notification', label: '알림' },
  { value: 'bug', label: '버그 신고' },
  { value: 'feature', label: '기능 요청' },
  { value: 'general', label: '기타' },
];

export default function InquiryWritePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  const [form, setForm] = useState({
    inquiryType: 'general' as InquiryType,
    title: '',
    content: '',
    isPublic: true,
  });
  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { mutate: create, isPending: isCreating } = useCreateInquiry();

  function handleSubmit() {
    if (!isLoggedIn) {
      setSubmitError('로그인 후 문의를 보낼 수 있습니다');
      return;
    }
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitError('');
    create(form, {
      onSuccess: () => setDoneModalOpen(true),
      onError: () => setSubmitError('문의 제출 중 오류가 발생했습니다'),
    });
  }

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar
        className="shrink-0"
        title="문의하기"
        onBack={() => router.push(ROUTES.INQUIRIES.HOME)}
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page py-6">
        <FormField label="문의 유형" required>
          <div className="flex flex-wrap gap-2 pt-1">
            {INQUIRY_TYPES.map((type) => (
              <Chip
                key={type.value}
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

        <FormField label="제목" required>
          <Input
            placeholder="제목을 입력해주세요"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={200}
            disabled={isCreating}
          />
        </FormField>

        <FormField
          label="문의 내용"
          required
          counter={{ current: form.content.length, max: 1000 }}
        >
          <Textarea
            rows={6}
            placeholder="문의하고 싶은 내용을 입력해주세요."
            value={form.content}
            onChange={(e) =>
              setForm((f) => ({ ...f, content: e.target.value }))
            }
            // maxLength={1000}
            disabled={isCreating}
          />
        </FormField>

        {/* 공개/비공개 토글 — 일단 숨김, 기본값: 공개(isPublic: true)
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
        */}

        {submitError && (
          <p className="text-[13px] text-danger">{submitError}</p>
        )}
      </main>

      <footer className="px-page pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
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

      <ConfirmDialog
        open={doneModalOpen}
        onOpenChange={setDoneModalOpen}
        title="문의가 접수됐어요"
        description="빠른 시일 내 답변드릴게요"
        confirmLabel="확인"
        onConfirm={() => {
          setDoneModalOpen(false);
          router.push(ROUTES.INQUIRIES.ME);
        }}
      />

    </div>
  );
}
