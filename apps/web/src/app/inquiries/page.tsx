'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMyInquiries, useCreateInquiry, useDeleteInquiry, usePublicInquiries } from '@/features/inquiries/hooks';
import type { InquiryType, InquiryStatus, PublicInquiry } from '@/features/inquiries/types';

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

export default function InquiriesPage() {
  const router = useRouter();
  const { data, isLoading } = useMyInquiries();
  const { mutate: create, isPending: isCreating } = useCreateInquiry();
  const { mutate: remove } = useDeleteInquiry();
  const { data: publicData, isLoading: isPublicLoading } = usePublicInquiries();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ inquiryType: 'general' as InquiryType, title: '', content: '', isPublic: true });
  const [expandedMyId, setExpandedMyId] = useState<string | null>(null);
  const [expandedPublicId, setExpandedPublicId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create(form, {
      onSuccess: (newInquiry) => {
        setShowForm(false);
        setForm({ inquiryType: 'general', title: '', content: '', isPublic: true });
        router.push(`/inquiries/${newInquiry.id}`);
      },
    });
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">문의하기</h1>
          {data && <p className="text-sm text-gray-500 mt-1">총 {data.total}개</p>}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          {showForm ? '취소' : '문의 작성'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 border rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">문의 유형</label>
            <select
              value={form.inquiryType}
              onChange={(e) => setForm((f) => ({ ...f, inquiryType: e.target.value as InquiryType }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(INQUIRY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">제목</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="제목을 입력해주세요"
              maxLength={200}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">내용</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="문의 내용을 입력해주세요"
              maxLength={5000}
              required
              rows={5}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">
                {form.isPublic ? '공개' : '비공개'}
              </span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isCreating ? '제출 중...' : '문의 제출'}
          </button>
        </form>
      )}

      {/* 내 문의 목록 - 모바일 카드 버전 */}
      <div className="block md:hidden">
        <h2 className="text-lg font-bold mb-4">나의 문의</h2>
        {isLoading ? (
          <p className="text-center text-gray-400 py-10">불러오는 중...</p>
        ) : data?.items.length === 0 ? (
          <p className="text-center text-gray-400 py-10">문의 내역이 없습니다</p>
        ) : (
          <ul className="space-y-3">
            {data?.items.map((inquiry) => {
              const status = STATUS_LABELS[inquiry.status];
              return (
                <li key={inquiry.id} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">{INQUIRY_TYPE_LABELS[inquiry.inquiryType]}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="font-medium truncate">{inquiry.title}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{inquiry.content}</p>
                      {inquiry.answer && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-500 font-medium mb-1">답변</p>
                          <p className="text-sm text-gray-700">{inquiry.answer}</p>
                        </div>
                      )}
                    </div>
                    {inquiry.status === 'pending' && (
                      <button
                        onClick={() => setDeleteTargetId(inquiry.id)}
                        className="text-gray-600 hover:text-red-500 shrink-0 transition-colors text-lg font-bold"
                        title="삭제"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 내 문의 목록 - PC 테이블 버전 */}
      <div className="hidden md:block mb-12">
        <h2 className="text-lg font-bold mb-4">나의 문의</h2>
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
                  <th className="px-4 py-3 text-left font-medium text-gray-700">공개</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">상태</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">날짜</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 w-12">삭제</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((inquiry) => {
                  const status = STATUS_LABELS[inquiry.status];
                  const isExpanded = expandedMyId === inquiry.id;
                  return (
                    <React.Fragment key={inquiry.id}>
                      <tr
                        onClick={() => setExpandedMyId(isExpanded ? null : inquiry.id)}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-600">{INQUIRY_TYPE_LABELS[inquiry.inquiryType]}</td>
                        <td className="px-4 py-3 font-medium truncate">{inquiry.title}</td>
                        <td className="px-4 py-3 text-gray-600">{inquiry.isPublic ? '공개' : '비공개'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {inquiry.status === 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetId(inquiry.id);
                              }}
                              className="text-gray-600 hover:text-red-500 transition-colors text-lg font-bold"
                              title="삭제"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b bg-gray-50">
                          <td colSpan={6} className="px-4 py-4">
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

      {/* 전체 공개 문의 목록 - 모바일 카드 버전 */}
      <div className="block md:hidden">
        <h2 className="text-lg font-bold mb-4">전체 문의 보기</h2>
        {isPublicLoading ? (
          <p className="text-center text-gray-400 py-10">불러오는 중...</p>
        ) : publicData?.items.length === 0 ? (
          <p className="text-center text-gray-400 py-10">공개된 문의가 없습니다</p>
        ) : (
          <ul className="space-y-3">
            {publicData?.items.map((inquiry: PublicInquiry) => {
              const status = STATUS_LABELS[inquiry.status];
              return (
                <li
                  key={inquiry.id}
                  onClick={() => router.push(`/inquiries/${inquiry.id}`)}
                  className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">{INQUIRY_TYPE_LABELS[inquiry.inquiryType]}</span>
                        <span className="text-xs text-gray-500">by {inquiry.authorNickname ?? '익명'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="font-medium truncate">{inquiry.title}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{inquiry.content}</p>
                      {inquiry.answer && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-500 font-medium mb-1">답변</p>
                          <p className="text-sm text-gray-700">{inquiry.answer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 전체 공개 문의 목록 - PC 테이블 버전 */}
      <div className="hidden md:block">
        <h2 className="text-lg font-bold mb-4">전체 문의 보기</h2>
        {isPublicLoading ? (
          <p className="text-center text-gray-400 py-10">불러오는 중...</p>
        ) : publicData?.items.length === 0 ? (
          <p className="text-center text-gray-400 py-10">공개된 문의가 없습니다</p>
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
                {publicData?.items.map((inquiry: PublicInquiry) => {
                  const status = STATUS_LABELS[inquiry.status];
                  const isExpanded = expandedPublicId === inquiry.id;
                  return (
                    <React.Fragment key={inquiry.id}>
                      <tr
                        onClick={() => setExpandedPublicId(isExpanded ? null : inquiry.id)}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-600">{INQUIRY_TYPE_LABELS[inquiry.inquiryType]}</td>
                        <td className="px-4 py-3 font-medium truncate">{inquiry.title}</td>
                        <td className="px-4 py-3 text-gray-600">{inquiry.authorNickname ?? '익명'}</td>
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

      {/* 삭제 확인 모달 */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <p className="text-lg font-medium mb-6">문의를 삭제하시겠습니까?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  remove(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
