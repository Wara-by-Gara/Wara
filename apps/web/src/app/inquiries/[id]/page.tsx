'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInquiry, useAnswerInquiry } from '@/features/inquiries/hooks';
import type { InquiryType, InquiryStatus, AnswerInquiryInput, Inquiry } from '@/features/inquiries/types';
import { getUserRole } from '@/lib/jwt';

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
  pending: { label: '답변 대기', className: 'bg-gray-100 text-gray-600' },
  in_progress: { label: '답변 중', className: 'bg-blue-100 text-blue-600' },
  resolved: { label: '답변 완료', className: 'bg-green-100 text-green-600' },
};

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: inquiry, isLoading, refetch } = useInquiry(id);
  const status = inquiry && STATUS_LABELS[inquiry.status];
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    const role = getUserRole();
    setIsAdmin(role === 'admin');
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        ← 목록으로
      </button>

      {isLoading ? (
        <p className="text-center text-gray-400 py-10">불러오는 중...</p>
      ) : !inquiry ? (
        <p className="text-center text-gray-400 py-10">문의를 찾을 수 없습니다</p>
      ) : (
        <div className="border rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${status?.className}`}>
                  {status?.label}
                </span>
                {inquiry.isPublic && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    공개
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold">{inquiry.title}</h1>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{inquiry.content}</p>
          </div>

          {inquiry.answer && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <p className="text-sm font-medium text-blue-900 mb-2">답변</p>
              <p className="text-gray-700 whitespace-pre-wrap">{inquiry.answer}</p>
              {inquiry.answeredAt && (
                <p className="text-xs text-blue-600 mt-3">
                  {new Date(inquiry.answeredAt).toLocaleDateString('ko-KR')}
                </p>
              )}
            </div>
          )}

          {isAdmin && !isAnswering && (
            <button
              onClick={() => setIsAnswering(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {inquiry.answer ? '답변 수정' : '답변 작성'}
            </button>
          )}

          {isAdmin && isAnswering && <AnswerForm inquiry={inquiry} onClose={() => setIsAnswering(false)} onSuccess={() => { setIsAnswering(false); refetch(); }} />}
        </div>
      )}
    </main>
  );
}

function AnswerForm({ inquiry, onClose, onSuccess }: { inquiry: Inquiry; onClose: () => void; onSuccess: () => void }) {
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
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-white rounded-lg border space-y-3">
      <textarea
        value={form.answer}
        onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
        placeholder="답변을 입력하세요"
        rows={4}
        required
        className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
      />
      <div className="flex items-center gap-2">
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AnswerInquiryInput['status'] }))}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="in_progress">답변 중</option>
          <option value="resolved">답변 완료</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '저장 중...' : '답변 저장'}
        </button>
        <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">
          취소
        </button>
      </div>
    </form>
  );
}
