/**
 * 테마 배경 공용 클록 — 레이어당 SharedValue 1개로 모든 파티클을 UI 스레드에서 구동.
 * 값은 초 단위(0 → CLOCK_PERIOD_S 선형 반복). 각 파티클은 (clock + phase) % duration 으로 진행률 계산.
 */

import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const CLOCK_PERIOD_S = 3600;

export function useThemeClock(): SharedValue<number> {
  const clock = useSharedValue(0);

  useEffect(() => {
    clock.value = 0;
    clock.value = withRepeat(
      withTiming(CLOCK_PERIOD_S, {
        duration: CLOCK_PERIOD_S * 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(clock);
  }, [clock]);

  return clock;
}

/** 웹 InvitationAnimation.tsx 와 동일한 index 기반 결정론적 의사난수 */
export function rand(i: number, salt: number, min: number, max: number): number {
  const v = ((i * 9301 + salt * 49297 + 233) % 233280) / 233280;
  return min + v * (max - min);
}
