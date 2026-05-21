import { apiClient } from '@/lib/api-client';
import type {
  Inquiry,
  InquiryListResponse,
  CreateInquiryInput,
  UpdateInquiryInput,
  AnswerInquiryInput,
  PublicInquiryListResponse,
} from './types';

export const inquiriesApi = {
  // 유저 API
  create: (body: CreateInquiryInput) => apiClient.post<Inquiry>('/inquiries', body),

  getMyList: () => apiClient.get<InquiryListResponse>('/inquiries/me'),

  getPublicList: () => apiClient.get<PublicInquiryListResponse>('/inquiries/public'),

  getById: (id: string) => apiClient.get<Inquiry>(`/inquiries/${id}`),

  update: (id: string, body: UpdateInquiryInput) =>
    apiClient.patch<Inquiry>(`/inquiries/${id}`, body),

  delete: (id: string) => apiClient.delete(`/inquiries/${id}`),

  // 관리자 API
  admin: {
    getAll: () => apiClient.get<InquiryListResponse>('/admin/inquiries'),

    getById: (id: string) => apiClient.get<Inquiry>(`/admin/inquiries/${id}`),

    answer: (id: string, body: AnswerInquiryInput) =>
      apiClient.patch<Inquiry>(`/admin/inquiries/${id}/answer`, body),
  },
};
