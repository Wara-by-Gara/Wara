/**
 * 초대장 생성 다단계 플로우의 스텝 간 폼 상태 공유 스토어.
 *
 * expo-router 스택은 스텝마다 별도 화면 인스턴스라 화면 간 상태 공유가 필요하다.
 * React Context 대신 모듈 레벨 외부 스토어 + `useSyncExternalStore`로 구현한다
 * (Provider 없이 어느 스텝에서든 동일 스냅샷 구독).
 */

import { useSyncExternalStore } from 'react';

import type { CreateInvitationPayload } from '@/api';

/** 플로우 동안 누적되는 폼 상태 (CreateInvitationPayload 기반, 기본값 채움). */
export type CreateInvitationFlowState = {
  templateId?: string;
  title: string;
  description: string;
  eventStartAt?: string; // ISO 문자열
  bgColor?: string;
  font?: string;
  animation?: string;
  rsvpAttendingEmoji: string;
  rsvpAttendingLabel: string;
  rsvpMaybeEmoji: string;
  rsvpMaybeLabel: string;
  rsvpDeclinedEmoji: string;
  rsvpDeclinedLabel: string;
  rsvpDeadlineAt?: string; // ISO 문자열
  isPublic: boolean;
  accessPassword?: string;
  mainImageKey?: string;
};

const initialState: CreateInvitationFlowState = {
  templateId: undefined,
  title: '',
  description: '',
  eventStartAt: undefined,
  bgColor: undefined,
  font: undefined,
  animation: undefined,
  rsvpAttendingEmoji: '🎉',
  rsvpAttendingLabel: '참석',
  rsvpMaybeEmoji: '🤔',
  rsvpMaybeLabel: '미정',
  rsvpDeclinedEmoji: '😢',
  rsvpDeclinedLabel: '불참',
  rsvpDeadlineAt: undefined,
  isPublic: false,
  accessPassword: undefined,
  mainImageKey: undefined,
};

let state: CreateInvitationFlowState = { ...initialState };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CreateInvitationFlowState {
  return state;
}

/** 부분 업데이트 — 넘긴 필드만 병합. */
function patch(partial: Partial<CreateInvitationFlowState>) {
  state = { ...state, ...partial };
  emit();
}

/** 초기값으로 리셋 (index 진입 시 호출). */
function reset() {
  state = { ...initialState };
  emit();
}

/**
 * 플로우 폼 상태 훅.
 * @returns `[state, patch, reset]`
 */
export function useCreateInvitationFlow(): [
  CreateInvitationFlowState,
  (partial: Partial<CreateInvitationFlowState>) => void,
  () => void,
] {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return [snapshot, patch, reset];
}

/** 스토어 값으로 생성 API payload 구성. 빈 값은 제외. */
export function buildCreatePayload(s: CreateInvitationFlowState): CreateInvitationPayload {
  const payload: CreateInvitationPayload = {
    title: s.title.trim(),
    description: s.description.trim(),
    isPublic: s.isPublic,
    rsvpAttendingEmoji: s.rsvpAttendingEmoji,
    rsvpAttendingLabel: s.rsvpAttendingLabel,
    rsvpMaybeEmoji: s.rsvpMaybeEmoji,
    rsvpMaybeLabel: s.rsvpMaybeLabel,
    rsvpDeclinedEmoji: s.rsvpDeclinedEmoji,
    rsvpDeclinedLabel: s.rsvpDeclinedLabel,
  };
  if (s.templateId) payload.templateId = s.templateId;
  if (s.eventStartAt) payload.eventStartAt = s.eventStartAt;
  if (s.rsvpDeadlineAt) payload.rsvpDeadlineAt = s.rsvpDeadlineAt;
  if (s.bgColor) payload.bgColor = s.bgColor;
  if (s.font) payload.font = s.font;
  if (s.animation) payload.animation = s.animation;
  if (s.accessPassword) payload.accessPassword = s.accessPassword;
  if (s.mainImageKey) payload.mainImageKey = s.mainImageKey;
  return payload;
}
