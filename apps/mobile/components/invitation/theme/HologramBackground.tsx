/**
 * 홀로그램 배경 — 웹 HologramBackground(thin-film iridescence 셰이더)의 RN 근사.
 * 흰 베이스 + 파스텔 무지개 패치 drift + 대각선 광택 sweep 2개 + sparkle twinkle.
 */

import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { rand, useThemeClock } from './themeClock';

const BASE = '#f7f7fc';

interface PatchSpec {
  key: number;
  color: string;
  size: number; // width 비율
  baseX: number; // width 비율
  baseY: number; // height 비율
  speed: number;
  phase: number;
}

const PATCHES: PatchSpec[] = [
  { key: 0, color: '#ffd0e8', size: 0.9, baseX: -0.2, baseY: 0.02, speed: 0.14, phase: 0 },
  { key: 1, color: '#cdeed9', size: 0.85, baseX: 0.5, baseY: 0.22, speed: 0.11, phase: 1.8 },
  { key: 2, color: '#cfe3ff', size: 0.95, baseX: -0.1, baseY: 0.52, speed: 0.16, phase: 3.5 },
  { key: 3, color: '#fdf2bd', size: 0.8, baseX: 0.45, baseY: 0.68, speed: 0.12, phase: 5.2 },
];

function IridescentPatch({
  clock,
  spec,
  width,
  height,
}: {
  clock: SharedValue<number>;
  spec: PatchSpec;
  width: number;
  height: number;
}) {
  const size = spec.size * width;

  const animatedStyle = useAnimatedStyle(() => {
    const t = clock.value * spec.speed + spec.phase;
    return {
      transform: [
        { translateX: spec.baseX * width + Math.sin(t) * width * 0.1 },
        { translateY: spec.baseY * height + Math.cos(t * 0.8) * height * 0.06 },
      ],
      opacity: 0.4 + 0.15 * Math.sin(t * 1.6),
    };
  });

  return (
    <Animated.View
      style={[
        styles.patch,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: spec.color },
        animatedStyle,
      ]}
    />
  );
}

function Sweep({
  clock,
  width,
  height,
  tint,
  period,
  reverse,
  phase,
}: {
  clock: SharedValue<number>;
  width: number;
  height: number;
  tint: string;
  period: number;
  reverse: boolean;
  phase: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const p = ((clock.value + phase) % period) / period;
    const from = reverse ? width * 1.2 : -width * 1.2;
    const to = reverse ? -width * 1.2 : width * 1.2;
    return {
      transform: [
        { translateX: from + p * (to - from) },
        { rotate: reverse ? '-40deg' : '40deg' },
      ],
    };
  });

  return (
    <Animated.View style={[styles.sweep, { width: width * 0.55, height: height * 2, top: -height * 0.5, left: width * 0.25 }, animatedStyle]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', tint, 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function Sparkle({
  clock,
  x,
  y,
  size,
  speed,
  phase,
}: {
  clock: SharedValue<number>;
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const tw = Math.max(0, Math.sin(clock.value * speed + phase));
    return {
      opacity: tw * tw * tw,
      transform: [{ scale: 0.6 + tw * 0.5 }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.sparkle,
        { left: x, top: y, width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
}

export function HologramBackground() {
  const { width, height } = useWindowDimensions();
  const clock = useThemeClock();

  const sparkles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        key: i,
        x: rand(i, 51, 0, 1) * width,
        y: rand(i, 52, 0, 1) * height,
        size: rand(i, 53, 2.5, 5),
        speed: rand(i, 54, 1.5, 5),
        phase: rand(i, 55, 0, Math.PI * 2),
      })),
    [width, height],
  );

  return (
    <View pointerEvents="none" style={styles.layer} aria-hidden>
      {PATCHES.map((spec) => (
        <IridescentPatch key={spec.key} clock={clock} spec={spec} width={width} height={height} />
      ))}
      <Sweep clock={clock} width={width} height={height} tint="rgba(255,255,255,0.6)" period={6.3} reverse={false} phase={0} />
      <Sweep clock={clock} width={width} height={height} tint="rgba(230,214,255,0.45)" period={9} reverse phase={3.2} />
      {sparkles.map(({ key, ...s }) => (
        <Sparkle key={key} clock={clock} {...s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: BASE,
  },
  patch: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sweep: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
});
