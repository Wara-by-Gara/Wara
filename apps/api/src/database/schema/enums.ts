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
  'instagram',
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
  'arrived',
  'nudge',
  'vote_reminder',
  'vote_confirmed',
  'vote_tied',
  'mention',
]);

export const remindTypeEnum = pgEnum('remind_type', ['D+7', 'D+30', 'D+365']);
export const notificationTargetTypeEnum = pgEnum('notification_target_type', [
  'photo',
  'feedback',
  'invitation',
  'mission',
  'participantLocations',
]);

export const dateVotePollStatusEnum = pgEnum('date_vote_poll_status', [
  'open',
  'closed',
  'confirmed',
]);
export const dateVoteResponseEnum = pgEnum('date_vote_response', [
  'good',
  'maybe',
  'bad',
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
