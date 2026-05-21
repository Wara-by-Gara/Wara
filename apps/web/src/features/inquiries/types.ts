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

export interface InquiryListResponse {
  items: Inquiry[];
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

export interface PublicInquiry extends Inquiry {
  authorNickname: string | null;
}

export interface PublicInquiryListResponse {
  items: PublicInquiry[];
  total: number;
}
