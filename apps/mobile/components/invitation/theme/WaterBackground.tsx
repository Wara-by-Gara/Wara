/**
 * 워터 배경 — 웹 WaterBackground(Three.js 파도 셰이더)의 RN 근사.
 * 터콰이즈 베이스 + 거품 웨이브 밴드 + 수면 반짝임 + 좌상단 태양빛 반사.
 */

import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { rand, useThemeClock } from './themeClock';

// 셰이더 팔레트 미러: seaDeep #59c7e0 / seaMid #80e0f0 / seaSurf #4cdbe6 / seaFoam #e0fafe
const SEA_COLORS = ['#8ce6f4', '#59c7e0', '#4cdbe6', '#38b8d4'] as const;

interface BandSpec {
  key: number;
  y: number; // 0~1
  height: number;
  speedX: number;
  speedY: number;
  phase: number;
  opacity: number;
}

const BANDS: BandSpec[] = [
  { key: 0, y: 0.16, height: 0.05, speedX: 0.5, speedY: 0.9, phase: 0.0, opacity: 0.2 },
  { key: 1, y: 0.34, height: 0.06, speedX: 0.7, speedY: 1.1, phase: 1.6, opacity: 0.24 },
  { key: 2, y: 0.52, height: 0.05, speedX: 0.4, speedY: 0.8, phase: 3.1, opacity: 0.2 },
  { key: 3, y: 0.7, height: 0.07, speedX: 0.9, speedY: 1.3, phase: 4.4, opacity: 0.28 },
  { key: 4, y: 0.86, height: 0.05, speedX: 0.6, speedY: 1.0, phase: 5.6, opacity: 0.32 },
];

function WaveBand({
  clock,
  spec,
  width,
  height,
}: {
  clock: SharedValue<number>;
  spec: BandSpec;
  width: number;
  height: number;
}) {
  const bandH = spec.height * height;

  const animatedStyle = useAnimatedStyle(() => {
    const t = clock.value;
    return {
      transform: [
        { translateX: Math.sin(t * spec.speedX + spec.phase) * width * 0.14 - width * 0.2 },
        { translateY: spec.y * height + Math.sin(t * spec.speedY + spec.phase * 2) * bandH * 0.3 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.band,
        { width: width * 1.4, height: bandH, borderRadius: bandH / 2, opacity: spec.opacity },
        animatedStyle,
      ]}
    >
      <View style={styles.foamLine} />
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
    const tw = (Math.sin(clock.value * speed + phase) + 1) / 2;
    return { opacity: tw * tw * 0.9 };
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

export function WaterBackground() {
  const { width, height } = useWindowDimensions();
  const clock = useThemeClock();

  const sparkles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        key: i,
        x: rand(i, 41, 0, 1) * width,
        y: rand(i, 42, 0.15, 1) * height,
        size: rand(i, 43, 2, 4),
        speed: rand(i, 44, 1.5, 4),
        phase: rand(i, 45, 0, Math.PI * 2),
      })),
    [width, height],
  );

  const sunSize = width * 0.7;

  return (
    <View pointerEvents="none" style={styles.layer} aria-hidden>
      <LinearGradient
        colors={[SEA_COLORS[0], SEA_COLORS[1], SEA_COLORS[2], SEA_COLORS[3]]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 태양빛 반사 (셰이더 sunGlow — 좌상단) */}
      <View
        style={[
          styles.sunGlow,
          {
            width: sunSize,
            height: sunSize,
            borderRadius: sunSize / 2,
            left: width * 0.2 - sunSize / 2,
            top: height * 0.3 - sunSize / 2,
          },
        ]}
      />
      {BANDS.map((spec) => (
        <WaveBand key={spec.key} clock={clock} spec={spec} width={width} height={height} />
      ))}
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
    backgroundColor: '#59c7e0',
  },
  band: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#e0fafe',
    justifyContent: 'flex-start',
  },
  foamLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginHorizontal: 12,
    marginTop: 2,
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  sunGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(224,250,254,0.35)',
  },
});
