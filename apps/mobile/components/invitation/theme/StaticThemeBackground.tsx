/**
 * 정적 테마 배경 — 웹 apps/web/src/styles/app.css 의 .bg-invite-* 그라데이션 미러.
 * pastel/sky/glass/y2k/flower/aurora 는 웹 bg-invite-shift 처럼 은은한 drift 모션.
 * starry/dreamy 는 반짝임(twinkle) 레이어 추가, checkdot 은 도트 그리드 근사.
 */

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import type { InviteBgThemeId } from '@/constants/invitationTheme';
import { rand, useThemeClock } from './themeClock';

type GradientSpec = {
  colors: [string, string, ...string[]];
  locations?: [number, number, ...number[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
  drift?: boolean;
};

const TO_BOTTOM = { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } };
const DIAGONAL = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };

/** app.css .bg-invite-* 색상 미러 (radial 레이어는 오버레이 View 로 근사) */
const GRADIENTS: Partial<Record<InviteBgThemeId, GradientSpec>> = {
  minimal: { colors: ['#ffffff', '#f3f4f6'], ...TO_BOTTOM },
  pastel: {
    colors: ['#fde8f0', '#e8f4fd', '#e8fdf0'],
    locations: [0, 0.45, 1],
    ...DIAGONAL,
    drift: true,
  },
  sky: {
    colors: ['#93c5fd', '#dbeafe', '#f0f9ff'],
    locations: [0, 0.42, 1],
    ...TO_BOTTOM,
    drift: true,
  },
  glass: {
    colors: ['rgba(255,255,255,0.95)', 'rgba(230,238,248,0.9)', '#f5f7fa'],
    locations: [0, 0.5, 1],
    ...DIAGONAL,
    drift: true,
  },
  y2k: {
    colors: ['#fbcfe8', '#a5f3fc', '#fef08a'],
    locations: [0, 0.48, 1],
    ...DIAGONAL,
    drift: true,
  },
  flower: { colors: ['#fff5f7', '#fdf2f8'], ...TO_BOTTOM, drift: true },
  film: {
    colors: ['#d6ccc2', '#ede8e0', '#f5f0eb'],
    locations: [0, 0.52, 1],
    ...TO_BOTTOM,
  },
  aurora: {
    colors: ['#312e81', '#5b21b6', '#0d9488', '#1e1b4b'],
    locations: [0, 0.38, 0.72, 1],
    ...DIAGONAL,
    drift: true,
  },
  starry: { colors: ['#0f172a', '#1e293b'], ...TO_BOTTOM },
  dreamy: {
    colors: ['#5f4cb0', '#8064c9', '#ad88dd', '#d8b6ef'],
    locations: [0, 0.32, 0.62, 1],
    ...TO_BOTTOM,
  },
};

const DRIFT_PERIOD_S = 18; // 웹 bg-invite-shift 18s

function DriftWrapper({
  clock,
  children,
  width,
  height,
}: {
  clock: SharedValue<number>;
  children: ReactNode;
  width: number;
  height: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const p = (clock.value % DRIFT_PERIOD_S) / DRIFT_PERIOD_S;
    const wave = (1 - Math.cos(p * Math.PI * 2)) / 2;
    return {
      transform: [
        { translateX: -wave * width * 0.25 },
        { translateY: -wave * height * 0.12 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.driftPlane, { width: width * 1.25, height: height * 1.12 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

function TwinkleDot({
  clock,
  x,
  y,
  size,
  speed,
  phase,
  maxOpacity,
  color = '#ffffff',
}: {
  clock: SharedValue<number>;
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  maxOpacity: number;
  color?: string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const tw = (Math.sin(clock.value * speed + phase) + 1) / 2;
    return { opacity: maxOpacity * (0.15 + tw * 0.85) };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.7,
          shadowRadius: size,
          shadowOffset: { width: 0, height: 0 },
        },
        animatedStyle,
      ]}
    />
  );
}

/** 별/반짝임 레이어 (starry 18개 / dreamy 8개) */
function TwinkleLayer({
  count,
  seed,
  maxSize,
}: {
  count: number;
  seed: number;
  maxSize: number;
}) {
  const { width, height } = useWindowDimensions();
  const clock = useThemeClock();
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        x: rand(i, seed + 1, 0, 1) * width,
        y: rand(i, seed + 2, 0, 1) * height,
        size: rand(i, seed + 3, 1.5, maxSize),
        speed: rand(i, seed + 4, 0.7, 2.3),
        phase: rand(i, seed + 5, 0, Math.PI * 2),
        maxOpacity: rand(i, seed + 6, 0.5, 0.95),
      })),
    [count, seed, maxSize, width, height],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map(({ key, ...d }) => (
        <TwinkleDot key={key} clock={clock} {...d} />
      ))}
    </View>
  );
}

/** checkdot — 16px 도트 그리드를 32px 간격 그리드로 근사 (뷰 수 절감) */
function CheckdotGrid() {
  const { width, height } = useWindowDimensions();
  const rows = useMemo(() => {
    const spacing = 32;
    const cols = Math.ceil(width / spacing);
    const rowCount = Math.ceil(height / spacing);
    return Array.from({ length: rowCount }, (_, r) => ({
      key: r,
      cols: Array.from({ length: cols }, (_, c) => c),
    }));
  }, [width, height]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.checkdotBase]}>
      {rows.map((row) => (
        <View key={row.key} style={styles.checkdotRow}>
          {row.cols.map((c) => (
            <View key={c} style={styles.checkdotDot} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** flower — radial 하이라이트 2개 근사 */
function FlowerOverlay() {
  const { width } = useWindowDimensions();
  const size = width * 0.9;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.radialBlob,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            left: -size * 0.25,
            top: '10%',
            backgroundColor: 'rgba(251,207,232,0.5)',
          },
        ]}
      />
      <View
        style={[
          styles.radialBlob,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            right: -size * 0.25,
            top: '52%',
            backgroundColor: 'rgba(254,226,226,0.45)',
          },
        ]}
      />
    </View>
  );
}

/** dreamy — 초승달 + 하단 glow 근사 */
function DreamyOverlay() {
  const { width, height } = useWindowDimensions();
  const moon = width * 0.055;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* 초승달: 밝은 원 위에 배경톤 원을 겹쳐 깎아냄 */}
      <View
        style={[
          styles.moon,
          {
            left: width * 0.17,
            top: height * 0.27,
            width: moon * 2,
            height: moon * 2,
            borderRadius: moon,
          },
        ]}
      />
      <View
        style={[
          styles.moonMask,
          {
            left: width * 0.17 - moon * 0.7,
            top: height * 0.27 - moon * 0.7,
            width: moon * 2,
            height: moon * 2,
            borderRadius: moon,
          },
        ]}
      />
      {/* 하단에서 올라오는 부드러운 빛 */}
      <View
        style={[
          styles.dreamyGlow,
          {
            width: width * 1.6,
            height: height * 0.5,
            borderRadius: width * 0.8,
            left: -width * 0.3,
            bottom: -height * 0.22,
          },
        ]}
      />
    </View>
  );
}

export function StaticThemeBackground({ themeId }: { themeId: InviteBgThemeId }) {
  const { width, height } = useWindowDimensions();
  const clock = useThemeClock();

  if (themeId === 'checkdot') {
    return (
      <View pointerEvents="none" style={styles.layer} aria-hidden>
        <CheckdotGrid />
      </View>
    );
  }

  const spec = GRADIENTS[themeId];
  if (!spec) return null;

  const gradient = (
    <LinearGradient
      colors={spec.colors}
      locations={spec.locations}
      start={spec.start}
      end={spec.end}
      style={StyleSheet.absoluteFill}
    />
  );

  return (
    <View pointerEvents="none" style={styles.layer} aria-hidden>
      {spec.drift ? (
        <DriftWrapper clock={clock} width={width} height={height}>
          {gradient}
        </DriftWrapper>
      ) : (
        gradient
      )}
      {themeId === 'flower' && <FlowerOverlay />}
      {themeId === 'starry' && <TwinkleLayer count={18} seed={11} maxSize={3} />}
      {themeId === 'dreamy' && (
        <>
          <DreamyOverlay />
          <TwinkleLayer count={10} seed={23} maxSize={4} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  driftPlane: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  dot: {
    position: 'absolute',
  },
  checkdotBase: {
    backgroundColor: '#fafafa',
    justifyContent: 'space-between',
  },
  checkdotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  checkdotDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#d1d5db',
  },
  radialBlob: {
    position: 'absolute',
  },
  moon: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  moonMask: {
    position: 'absolute',
    backgroundColor: '#8064c9',
  },
  dreamyGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,221,247,0.4)',
  },
});
