'use client';

import React, { useState } from 'react';
import { useAdminInquiries, useAnswerInquiry } from '@/hooks/useInquiries';
import type { Inquiry, InquiryType, InquiryStatus, AnswerInquiryInput } from '@/lib/api/inquiries';

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

export default function AdminInquiriesPage() {
  const { data, isLoading } = useAdminInquiries();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answeringId, setAnsweringId] = useState<string | null>(null);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">전체 문의 관리</h1>
        {data && <p className="text-sm text-gray-500 mt-1">총 {data.total}개</p>}
      </div>

      {/* 모바일 카드 버전 */}
      <div className="block md:hidden">
        {isLoading ? (
          <p className="text-center text-gray-400 py-10">불러오는 중...</p>
        ) : data?.items.length === 0 ? (
          <p className="text-center text-gray-400 py-10">문의 내역이 없습니다</p>
        ) : (
          <ul className="space-y-3">
            {data?.items.map((inquiry) => {
              const status = STATUS_LABELS[inquiry.status];
              const isExpanded = expandedId === inquiry.id;
              const isAnswering = answeringId === inquiry.id;
              return (
                <li key={inquiry.id} className="border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400">{INQUIRY_TYPE_LABELS[inquiry.inquiryType]}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="font-medium truncate">{inquiry.title}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t bg-white">
                      <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{inquiry.content}</p>

                      {inquiry.answer && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-500 font-medium mb-1">답변</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.answer}</p>
                        </div>
                      )}

                      {!isAnswering && (
                        <button
                          onClick={() => setAnsweringId(inquiry.id)}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {inquiry.answer ? '답변 수정' : '답변 작성'}
                        </button>
                      )}

                      {isAnswering && <AnswerForm inquiry={inquiry} onClose={() => setAnsweringId(null)} />}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* PC 테이블 버전 */}
      <div className="hidden md:block">
        {isLoading ? (
          <p className="text-center text-gray-400 py-10">불러오는 중...</p>
        ) : data?.items.length === 0 ? (
          <p className="text-center text-gray-400 py-10">문의 내역이 없습니다</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">분류</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">제목</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">작성자</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">상태</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">날짜</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((inquiry) => {
                  const status = STATUS_LABELS[inquiry.status];
                  const isExpanded = expandedId === inquiry.id;
                  const isAnswering = answeringId === inquiry.id;
                  return (
                    <React.Fragment key={inquiry.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-600">{INQUIRY_TYPE_LABELS[inquiry.inquiryType]}</td>
                        <td className="px-4 py-3 font-medium truncate">{inquiry.title}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs font-mono">{inquiry.userId.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b bg-gray-50">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">내용</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.content}</p>
                              </div>

                              {inquiry.answer && (
                                <div className="pt-3 border-t">
                                  <p className="text-xs font-medium text-blue-600 mb-1">답변</p>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.answer}</p>
                                </div>
                              )}

                              {!isAnswering && (
                                <div className="pt-2">
                                  <button
                                    onClick={() => setAnsweringId(inquiry.id)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    {inquiry.answer ? '답변 수정' : '답변 작성'}
                                  </button>
                                </div>
                              )}

                              {isAnswering && <AnswerForm inquiry={inquiry} onClose={() => setAnsweringId(null)} />}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function AnswerForm({ inquiry, onClose }: { inquiry: Inquiry; onClose: () => void }) {
  const { mutate: answer, isPending } = useAnswerInquiry(inquiry.id);
  const [form, setForm] = useState<AnswerInquiryInput>({
    answer: inquiry.answer ?? '',
    status: inquiry.status === 'pending' ? 'in_progress' : inquiry.status,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    answer(form, { onSuccess: onClose });
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
          <option value="resolved">해결됨</option>
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
