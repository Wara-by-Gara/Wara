import { pgEnum } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['female', 'male']);
export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);

export const SOCIAL_PROVIDERS = ['google', 'kakao', 'naver', 'apple'] as const;
export const socialProviderEnum = pgEnum('social_provider', [
  ...SOCIAL_PROVIDERS,
]);

export const invitationStatusEnum = pgEnum('invitation_status', [
  'active',
  'closed',
]);

export const memberRoleEnum = pgEnum('member_role', ['HOST', 'GUEST']);
export const rsvpStatusEnum = pgEnum('rsvp_status', [
  'attending',
  'undecided',
  'absent',
]);

export const sendChannelEnum = pgEnum('send_channel', [
  'link',
  'kakao',
  'sms',
  'email',
  'dm',
]);

export const linkEventTypeEnum = pgEnum('link_event_type', [
  'opened',
  'joined',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'remind',
  'participantLocations',
  'eventLocations',
  'feedback',
  'invitation_date',
  'photo',
]);
export const notificationTargetTypeEnum = pgEnum('notification_target_type', [
  'photo',
  'feedback',
  'invitation',
  'mission',
  'participantLocations',
]);

export const inquiryTypeEnum = pgEnum('inquiry_type', [
  'invitation',
  'photo',
  'notification',
  'mission',
  'bug',
  'feature',
  'general',
]);
export const inquiryStatusEnum = pgEnum('inquiry_status', [
  'pending',
  'in_progress',
  'resolved',
]);
