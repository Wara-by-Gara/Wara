/**
 * 검은 고양이 그리드 배경 — 웹 BlackCatGridLayer 의 RN 근사.
 * 웹은 PNG 스프라이트 페어(모바일 미번들)라, 셀별 고양이 얼굴(귀/눈/코)을 View 로 그려
 * 깜빡임(blink)/윙크/졸음/꼬리 흔들기/popup 모션을 웹 셀 배치·딜레이에 맞춰 재현.
 * 모바일 레이아웃 미러: 2열 x 4행 (웹 모바일과 동일, 9번째 셀 생략).
 */

import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { useThemeClock } from './themeClock';

const CAT_BG_A = '#0e0b08';
const CAT_BG_B = '#14100c';
const EYE_COLOR = '#f2c14e';
const POPUP_BG = '#bcc79d'; // 웹 popup 셀 배경 미러

const BLINK_PERIOD_S = 4.8;

type CellKind = 'blink' | 'wink' | 'sleep' | 'wag' | 'popup';

interface CellSpec {
  kind: CellKind;
  delay: number;
}

// 웹 CELLS 모바일 8칸 미러 (excited/blep/innocent 은 blink 로 근사)
const CELLS: CellSpec[] = [
  { kind: 'blink', delay: 0 },
  { kind: 'blink', delay: 3.6 }, // excited
  { kind: 'sleep', delay: 2.8 },
  { kind: 'blink', delay: 1.2 }, // blep
  { kind: 'blink', delay: 4.4 }, // innocent
  { kind: 'wink', delay: 0.6 },
  { kind: 'wag', delay: 0 },
  { kind: 'popup', delay: 1.8 },
];

/** (clock+delay)%period 기준 눈 감김 정도 0(open)~1(closed) — 주기 끝 0.25s 동안 깜빡 */
function blinkAmount(t: number, delay: number): number {
  'worklet';
  const p = (t + delay) % BLINK_PERIOD_S;
  const start = BLINK_PERIOD_S - 0.3;
  return interpolate(
    p,
    [0, start, start + 0.12, start + 0.18, start + 0.3],
    [0, 0, 1, 1, 0],
  );
}

function Eye({
  clock,
  delay,
  closes,
}: {
  clock: SharedValue<number>;
  delay: number;
  closes: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const amount = closes ? blinkAmount(clock.value, delay) : 0;
    return { transform: [{ scaleY: 1 - amount * 0.9 }] };
  });

  return (
    <Animated.View style={[styles.eye, animatedStyle]}>
      <View style={styles.pupil} />
    </Animated.View>
  );
}

function ClosedEye() {
  return <View style={styles.closedEye} />;
}

function CatFace({
  clock,
  delay,
  variant,
}: {
  clock: SharedValue<number>;
  delay: number;
  variant: 'blink' | 'wink' | 'sleep';
}) {
  return (
    <View style={styles.face}>
      <View style={styles.earRow}>
        <View style={[styles.ear, styles.earLeft]} />
        <View style={[styles.ear, styles.earRight]} />
      </View>
      <View style={styles.head}>
        <View style={styles.eyeRow}>
          {variant === 'sleep' ? (
            <>
              <ClosedEye />
              <ClosedEye />
            </>
          ) : (
            <>
              <Eye clock={clock} delay={delay} closes />
              {variant === 'wink' ? (
                <Eye clock={clock} delay={delay} closes={false} />
              ) : (
                <Eye clock={clock} delay={delay} closes />
              )}
            </>
          )}
        </View>
        <View style={styles.nose} />
      </View>
    </View>
  );
}

/** 졸음 셀 — 감은 눈 + "z" 부유 */
function SleepExtras({ clock, delay }: { clock: SharedValue<number>; delay: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    const p = ((clock.value + delay) % 3) / 3;
    return {
      opacity: interpolate(p, [0, 0.2, 0.8, 1], [0, 0.8, 0.8, 0]),
      transform: [{ translateY: -p * 14 }],
    };
  });

  return (
    <Animated.Text allowFontScaling={false} style={[styles.snoreZ, animatedStyle]}>
      z z
    </Animated.Text>
  );
}

/** 꼬리 흔들기 셀 — 뒷모습(둥근 등) + 꼬리 rotate */
function WagCell({ clock }: { clock: SharedValue<number> }) {
  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.sin(clock.value * 3.2) * 14}deg` }],
  }));

  return (
    <View style={styles.wagBody}>
      <Animated.View style={[styles.tail, { transformOrigin: '50% 100%' }, tailStyle]} />
      <View style={styles.back} />
    </View>
  );
}

/** popup 셀 — 연녹색 배경에서 고양이 머리가 아래에서 빼꼼 */
function PopupCell({ clock, delay }: { clock: SharedValue<number>; delay: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    const p = ((clock.value + delay) % 6) / 6;
    const up = interpolate(p, [0, 0.12, 0.5, 0.62, 1], [0, 1, 1, 0, 0]);
    return { transform: [{ translateY: (1 - up) * 70 }] };
  });

  return (
    <View style={[styles.cell, styles.popupCell]}>
      <Animated.View style={[styles.popupHead, animatedStyle]}>
        <View style={styles.earRow}>
          <View style={[styles.ear, styles.earLeft, styles.popupEar]} />
          <View style={[styles.ear, styles.earRight, styles.popupEar]} />
        </View>
        <View style={styles.popupSkull}>
          <View style={styles.eyeRow}>
            <View style={styles.popupEye} />
            <View style={styles.popupEye} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export function BlackCatGridBackground() {
  const clock = useThemeClock();

  return (
    <View pointerEvents="none" style={styles.layer} aria-hidden>
      {CELLS.map((cell, i) => {
        if (cell.kind === 'popup') {
          return <PopupCell key={i} clock={clock} delay={cell.delay} />;
        }
        return (
          <View
            key={i}
            style={[styles.cell, { backgroundColor: i % 2 === 0 ? CAT_BG_A : CAT_BG_B }]}
          >
            {cell.kind === 'wag' ? (
              <WagCell clock={clock} />
            ) : (
              <>
                <CatFace clock={clock} delay={cell.delay} variant={cell.kind} />
                {cell.kind === 'sleep' && <SleepExtras clock={clock} delay={cell.delay} />}
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: CAT_BG_A,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    height: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  face: {
    alignItems: 'center',
  },
  earRow: {
    flexDirection: 'row',
    gap: 26,
    zIndex: 0,
    marginBottom: -10,
  },
  ear: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1c1712',
  },
  earLeft: { transform: [{ rotate: '-14deg' }] },
  earRight: { transform: [{ rotate: '14deg' }] },
  head: {
    width: 84,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1c1712',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 18,
  },
  eye: {
    width: 15,
    height: 19,
    borderRadius: 9,
    backgroundColor: EYE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 4,
    height: 11,
    borderRadius: 2,
    backgroundColor: '#12100d',
  },
  closedEye: {
    width: 15,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: EYE_COLOR,
    marginVertical: 8,
  },
  nose: {
    width: 7,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#c9788a',
  },
  snoreZ: {
    position: 'absolute',
    top: '22%',
    right: '24%',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
  },
  wagBody: {
    alignItems: 'center',
  },
  back: {
    width: 96,
    height: 62,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    backgroundColor: '#1c1712',
  },
  tail: {
    width: 9,
    height: 52,
    borderRadius: 5,
    backgroundColor: '#1c1712',
    marginBottom: -44,
    zIndex: 1,
  },
  popupCell: {
    backgroundColor: POPUP_BG,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  popupHead: {
    alignItems: 'center',
    marginBottom: -12,
  },
  popupEar: {
    borderBottomColor: '#12100d',
  },
  popupSkull: {
    width: 84,
    height: 62,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#12100d',
    alignItems: 'center',
    paddingTop: 20,
  },
  popupEye: {
    width: 13,
    height: 16,
    borderRadius: 8,
    backgroundColor: EYE_COLOR,
  },
});
