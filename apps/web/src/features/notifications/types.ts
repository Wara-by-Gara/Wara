export type NotificationType =
  | 'remind'
  | 'participantLocations'
  | 'eventLocations'
  | 'feedback'
  | 'invitation_date'
  | 'photo';

export type NotificationTargetType =
  | 'photo'
  | 'feedback'
  | 'invitation'
  | 'mission'
  | 'participantLocations';

export type Notification = {
  id: string;
  userId: string;
  actorUserId: string | null;
  type: NotificationType;
  content: string;
  targetType: NotificationTargetType | null;
  targetId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationSettings = {
  id: string;
  userId: string;
  isRemind: boolean;
  isFeedback: boolean;
  isInvitationDate: boolean;
  isPhoto: boolean;
  isMission: boolean;
  isParticipantLocations: boolean;
  isEventLocations: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationsPage = {
  items: Notification[];
  nextCursor: string | null;
  hasNext: boolean;
};

export type UpdateNotificationSettingsDto = Partial<
  Pick<
    NotificationSettings,
    | 'isRemind'
    | 'isFeedback'
    | 'isInvitationDate'
    | 'isPhoto'
    | 'isMission'
    | 'isParticipantLocations'
    | 'isEventLocations'
  >
>;
