/**
 * 햅틱 피드백 래퍼 (expo-haptics).
 * iOS 네이티브 인터랙션 감각을 위해 탭/토글/스와이프 커밋/성공·실패에 사용.
 */

import * as Haptics from 'expo-haptics';

export const haptics = {
  /** 값 선택·세그먼트 전환 등 미세 피드백. */
  selection: () => Haptics.selectionAsync(),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  /** 뮤테이션 성공 (RSVP 완료 등). */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  /** 파괴적 액션·에러. */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
