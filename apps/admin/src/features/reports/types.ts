export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportTargetType = 'photo' | 'feedback';

export interface AdminReport {
  id: string;
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  invitationId: string | null;
  reason: string | null;
  status: ReportStatus;
  adminMemo: string | null;
  handledByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
