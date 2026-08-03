export type InquiryStatus = 'pending' | 'in_progress' | 'resolved';

export interface AdminInquiry {
  id: string;
  userId: string;
  inquiryType: string;
  status: InquiryStatus;
  title: string;
  content: string;
  isPublic: boolean;
  answer: string | null;
  answeredAt: string | null;
  adminId: string | null;
  adminNickname?: string | null;
  createdAt: string;
  updatedAt: string;
}
