'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { MainBottomNav } from '@/components/layout/MainBottomNav';
import { MenuItem } from '@/components/molecules/MenuItem';
import { IconButton } from '@/components/primitives/IconButton';
import { Icon } from '@/components/icons';
import { Button } from '@/components/primitives/Button';
import { ConfirmModal } from '@/components/molecules/Modal';
import { useAdminFaq, useCreateFaq, useUpdateFaq, useDeleteFaq } from '@/hooks/useFaq';
import { ROUTES } from '@/constants/routes';
import type { FaqItem, CreateFaqPayload, UpdateFaqPayload } from '@/lib/api/faq';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col py-2">
    <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-tertiary">
      {title}
    </h2>
    <div className="divide-y divide-border bg-surface">{children}</div>
  </section>
);

export default function AdminFaqPage() {
  const router = useRouter();
  const { data: items, isLoading } = useAdminFaq();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { mutate: remove } = useDeleteFaq();

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar
        className="shrink-0"
        title="FAQ 관리"
        onBack={() => router.push(ROUTES.INQUIRIES.HOME)}
      />

      <main className="min-h-0 flex-1 overflow-y-auto pb-24">
        {/* 관리 액션 */}
        <Section title="관리">
          <MenuItem
            leftIcon="plus"
            rightSlot={<Icon name="chevron-right" size="sm" color="inactive" decorative />}
            onClick={() => { setIsCreating(true); setEditingId(null); }}
          >
            새 항목 추가
          </MenuItem>
        </Section>

        {/* 생성 폼 */}
        {isCreating && (
          <div className="bg-surface px-4 py-4 border-t border-border">
            <CreateFaqForm
              nextSortOrder={items?.length ?? 0}
              onClose={() => setIsCreating(false)}
            />
          </div>
        )}

        {/* FAQ 목록 */}
        <Section title={`자주 묻는 질문${items ? ` (${items.length})` : ''}`}>
          {isLoading && (
            <p className="px-4 py-3 text-[14px] text-text-tertiary">불러오는 중...</p>
          )}
          {!isLoading && items?.length === 0 && !isCreating && (
            <p className="px-4 py-3 text-[14px] text-text-tertiary">등록된 항목이 없습니다</p>
          )}
          {items?.map((item) => (
            <div key={item.id} className="flex flex-col">
              <MenuItem
                rightSlot={
                  editingId !== item.id ? (
                    <div className="flex items-center gap-1">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                          item.isActive
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.isActive ? '활성' : '비활성'}
                      </span>
                      <IconButton
                        icon="edit"
                        size="sm"
                        aria-label="FAQ 수정"
                        onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }}
                      />
                      <IconButton
                        icon="trash"
                        variant="danger"
                        size="sm"
                        aria-label="FAQ 삭제"
                        onClick={(e) => { e.stopPropagation(); setDeleteTargetId(item.id); }}
                      />
                    </div>
                  ) : undefined
                }
                onClick={() => {
                  if (editingId !== item.id) setEditingId(item.id);
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-text-tertiary">정렬 {item.sortOrder}</span>
                  <span className="text-[15px] text-text-primary">{item.question}</span>
                  {editingId !== item.id && (
                    <span className="line-clamp-1 text-[13px] text-text-tertiary">{item.answer}</span>
                  )}
                </div>
              </MenuItem>

              {/* 인라인 수정 폼 */}
              {editingId === item.id && (
                <div className="bg-surface px-4 py-4 border-t border-border">
                  <EditFaqForm item={item} onClose={() => setEditingId(null)} />
                </div>
              )}
            </div>
          ))}
        </Section>
      </main>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="이 항목을 삭제하시겠습니까?"
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

function CreateFaqForm({
  nextSortOrder,
  onClose,
}: {
  nextSortOrder: number;
  onClose: () => void;
}) {
  const { mutate: create, isPending } = useCreateFaq();
  const [form, setForm] = useState<CreateFaqPayload>({
    question: '',
    answer: '',
    sortOrder: nextSortOrder,
    isActive: true,
  });
  const [submitError, setSubmitError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    create(form, {
      onSuccess: onClose,
      onError: () => setSubmitError('저장 중 오류가 발생했습니다'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-[14px] font-medium text-text-primary">새 항목 추가</p>
      <input
        name="question"
        value={form.question}
        onChange={handleChange}
        placeholder="질문 (최대 200자)"
        maxLength={200}
        required
        disabled={isPending}
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
      <textarea
        name="answer"
        value={form.answer}
        onChange={handleChange}
        placeholder="답변 (최대 2000자)"
        maxLength={2000}
        rows={4}
        required
        disabled={isPending}
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[14px] text-text-secondary">
          정렬 순서
          <input
            type="number"
            name="sortOrder"
            value={form.sortOrder}
            onChange={handleChange}
            min={0}
            disabled={isPending}
            className="w-16 rounded-lg border border-border px-2 py-1 text-[14px]"
          />
        </label>
        <label className="flex items-center gap-2 text-[14px] text-text-secondary">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            disabled={isPending}
          />
          활성화
        </label>
      </div>
      {submitError && <p className="text-[13px] text-danger">{submitError}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" loading={isPending}>
          저장
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
          취소
        </Button>
      </div>
    </form>
  );
}

function EditFaqForm({ item, onClose }: { item: FaqItem; onClose: () => void }) {
  const { mutate: update, isPending } = useUpdateFaq();
  const [form, setForm] = useState<UpdateFaqPayload>({
    question: item.question,
    answer: item.answer,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  });
  const [submitError, setSubmitError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    update({ id: item.id, payload: form }, {
      onSuccess: onClose,
      onError: () => setSubmitError('저장 중 오류가 발생했습니다'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-[14px] font-medium text-text-primary">항목 수정</p>
      <input
        name="question"
        value={form.question}
        onChange={handleChange}
        placeholder="질문"
        maxLength={200}
        required
        disabled={isPending}
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
      <textarea
        name="answer"
        value={form.answer}
        onChange={handleChange}
        placeholder="답변"
        maxLength={2000}
        rows={4}
        required
        disabled={isPending}
        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[14px] text-text-secondary">
          정렬 순서
          <input
            type="number"
            name="sortOrder"
            value={form.sortOrder}
            onChange={handleChange}
            min={0}
            disabled={isPending}
            className="w-16 rounded-lg border border-border px-2 py-1 text-[14px]"
          />
        </label>
        <label className="flex items-center gap-2 text-[14px] text-text-secondary">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            disabled={isPending}
          />
          활성화
        </label>
      </div>
      {submitError && <p className="text-[13px] text-danger">{submitError}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" loading={isPending}>
          수정 저장
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
          취소
        </Button>
      </div>
    </form>
  );
}
