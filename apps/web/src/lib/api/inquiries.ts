import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export type InquiryType =
  | 'invitation'
  | 'photo'
  | 'notification'
  | 'mission'
  | 'bug'
  | 'feature'
  | 'general';

export type InquiryStatus = 'pending' | 'in_progress' | 'resolved';

export interface Inquiry {
  id: string;
  userId: string;
  inquiryType: InquiryType;
  status: InquiryStatus;
  title: string;
  content: string;
  isPublic: boolean;
  answer: string | null;
  answeredAt: string | null;
  adminId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicInquiry extends Inquiry {
  authorNickname: string | null;
}

export interface InquiryListResponse {
  items: Inquiry[];
  total: number;
}

export interface PublicInquiryListResponse {
  items: PublicInquiry[];
  total: number;
}

export interface CreateInquiryInput {
  inquiryType: InquiryType;
  title: string;
  content: string;
  isPublic?: boolean;
}

export interface UpdateInquiryInput {
  title: string;
  content: string;
  isPublic?: boolean;
}

export interface AnswerInquiryInput {
  answer: string;
  status: 'in_progress' | 'resolved';
}

export function getMyInquiries() {
  return apiGet<InquiryListResponse>('/inquiries/me');
}

export function getPublicInquiries() {
  return apiGet<PublicInquiryListResponse>('/inquiries/public');
}

export function getInquiry(id: string) {
  return apiGet<Inquiry>(`/inquiries/${id}`);
}

export function createInquiry(body: CreateInquiryInput) {
  return apiPost<Inquiry>('/inquiries', body);
}

export function updateInquiry(id: string, body: UpdateInquiryInput) {
  return apiPatch<Inquiry>(`/inquiries/${id}`, body);
}

export function deleteInquiry(id: string) {
  return apiDelete(`/inquiries/${id}`);
}

export function getAdminInquiries() {
  return apiGet<InquiryListResponse>('/admin/inquiries');
}

export function getAdminInquiry(id: string) {
  return apiGet<Inquiry>(`/admin/inquiries/${id}`);
}

export function answerInquiry(id: string, body: AnswerInquiryInput) {
  return apiPatch<Inquiry>(`/admin/inquiries/${id}/answer`, body);
}
