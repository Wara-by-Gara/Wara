import { apiGet, apiPatch } from '@/lib/api/client';
import type { AdminInquiry } from './types';

export function fetchInquiries() {
  return apiGet<AdminInquiry[]>('/admin/inquiries');
}

export function fetchInquiry(id: string) {
  return apiGet<AdminInquiry>(`/admin/inquiries/${id}`);
}

export function answerInquiry(id: string, body: { answer: string; status: 'in_progress' | 'resolved' }) {
  return apiPatch<AdminInquiry>(`/admin/inquiries/${id}/answer`, body);
}
