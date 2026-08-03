import { pgEnum } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['female', 'male']);
export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);

// 네이티브 푸시(Expo) 기기 플랫폼 — device_tokens.platform.
export const devicePlatformEnum = pgEnum('device_platform', ['ios', 'android']);

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

export const activityEventTypeEnum = pgEnum('activity_event_type', [
  'login',
  'invitation_created',
  'invitation_sent',
  'participant_joined',
  'link_opened',
  'feedback_created',
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
  'ai_complete',
  'vote_reminder',
  'vote_confirmed',
  'vote_tied',
  'mention',
  'participant_joined',
  'text_blast',
  'message',
  'inquiry_answer',
]);

export const remindTypeEnum = pgEnum('remind_type', ['D-1', 'D+7', 'D+30', 'D+365']);
export const notificationTargetTypeEnum = pgEnum('notification_target_type', [
  'photo',
  'feedback',
  'invitation',
  'mission',
  'participantLocations',
  'conversation',
]);

export const mainCoverTypeEnum = pgEnum('main_cover_type', ['image', 'gif']);

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
// 'date' = 날짜/시간 후보 투표(확정 시 eventStartAt 세팅), 'custom' = 임의 텍스트 후보 투표
export const dateVoteTypeEnum = pgEnum('date_vote_type', ['date', 'custom']);
// 비용 정산 상태 / 항목 분배 방식
export const settlementStatusEnum = pgEnum('settlement_status', ['open', 'confirmed']);
export const settlementSplitTypeEnum = pgEnum('settlement_split_type', ['equal', 'custom']);
// 콘텐츠 신고 대상 / 처리 상태
export const reportTargetTypeEnum = pgEnum('report_target_type', ['photo', 'feedback']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewing', 'resolved', 'dismissed']);
// 위치 공유 프라이버시 티어: full=정확좌표, distance=대략(coarse), hidden=비공개
export const locationTierEnum = pgEnum('location_tier', ['full', 'distance', 'hidden']);

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

export const termTypeEnum = pgEnum('term_type', [
  'service',
  'privacy',
  'marketing',
  'location',
  'analytics',
  'age',
]);
