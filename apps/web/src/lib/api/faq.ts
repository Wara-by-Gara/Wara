import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqPayload {
  question: string;
  answer: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateFaqPayload {
  question?: string;
  answer?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export function getActiveFaq() {
  return apiGet<FaqItem[]>('/faq');
}

export function getAdminFaq() {
  return apiGet<FaqItem[]>('/admin/faq');
}

export function createFaqItem(payload: CreateFaqPayload) {
  return apiPost<FaqItem>('/admin/faq', payload);
}

export function updateFaqItem(id: string, payload: UpdateFaqPayload) {
  return apiPatch<FaqItem>(`/admin/faq/${id}`, payload);
}

export function deleteFaqItem(id: string) {
  return apiDelete(`/admin/faq/${id}`);
}
