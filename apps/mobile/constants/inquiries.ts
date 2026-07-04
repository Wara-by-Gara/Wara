// 문의 화면 공통 상수/헬퍼 — 목록·상세·작성 라우트가 함께 사용한다.
// 라벨·에러 카피는 웹(/inquiries/*) 미러.

import { WaraApiError } from '@/api';
import type { InquiryStatus, InquiryType } from '@/api/inquiries';
import { ios } from '@/theme';

export const INQUIRY_TYPE_LABEL: Record<InquiryType, string> = {
  invitation: '초대장',
  photo: '사진',
  notification: '알림',
  mission: '미션',
  bug: '오류 신고',
  feature: '기능 제안',
  general: '일반 문의',
};

export const INQUIRY_TYPE_ORDER: InquiryType[] = [
  'general',
  'invitation',
  'photo',
  'notification',
  'mission',
  'bug',
  'feature',
];

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  pending: '접수됨',
  in_progress: '처리 중',
  resolved: '답변 완료',
};

const INQUIRY_ERROR: Record<string, string> = {
  INQUIRY_NOT_FOUND: '문의를 찾을 수 없어요.',
  INQUIRY_FORBIDDEN: '본인 문의만 접근할 수 있어요.',
  INQUIRY_NOT_EDITABLE: '답변이 시작된 문의는 수정할 수 없어요.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
};

export function inquiryErrorMessage(err: unknown): string {
  if (err instanceof WaraApiError) return INQUIRY_ERROR[err.code] ?? '오류가 발생했어요.';
  return '오류가 발생했어요.';
}

export function inquiryStatusColor(status: InquiryStatus) {
  if (status === 'resolved') return ios.systemGreen;
  if (status === 'in_progress') return ios.systemOrange;
  return ios.secondaryLabel;
}
