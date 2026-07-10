/**
 * 갤럭시 배경 — 웹 GalaxyBackground(Three.js FBM 성운 셰이더)의 RN 근사.
 * 심우주 남보라 베이스 + 성운 blob 3개(퍼플/라벤더/흰빛 코어) 저속 drift + 별 twinkle.
 */

import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { rand, useThemeClock } from './themeClock';

// 셰이더 색상 미러: base vec3(0.04,0.02,0.10), nebula1 딥퍼플, nebula2 라벤더, nebula3 흰빛
const BASE_TOP = '#0a051a';
const BASE_BOTTOM = '#140b2e';
const NEBULA_DEEP = '#6119b8';
const NEBULA_LAVENDER = '#9e47e6';
const NEBULA_CORE = '#d9d1fa';

function NebulaBlob({
  clock,
  color,
  w,
  h,
  baseX,
  baseY,
  speed,
  phase,
  opacity,
  baseRotate,
}: {
  clock: SharedValue<number>;
  color: string;
  w: number;
  h: number;
  baseX: number;
  baseY: number;
  speed: number;
  phase: number;
  opacity: number;
  baseRotate: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const t = clock.value * speed + phase;
    return {
      transform: [
        { translateX: baseX + Math.sin(t) * w * 0.12 },
        { translateY: baseY + Math.cos(t * 0.75) * h * 0.35 },
        { rotate: `${baseRotate + Math.sin(t * 0.5) * 9}deg` },
      ],
      opacity: opacity * (0.8 + 0.2 * Math.sin(t * 1.3)),
    };
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        { width: w, height: h, borderRadius: Math.min(w, h) / 2, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

function Star({
  clock,
  x,
  y,
  size,
  speed,
  phase,
  maxOpacity,
}: {
  clock: SharedValue<number>;
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  maxOpacity: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const tw = (Math.sin(clock.value * speed + phase) + 1) / 2;
    return { opacity: maxOpacity * (0.2 + tw * 0.8) };
  });

  return (
    <Animated.View
      style={[
        styles.star,
        { left: x, top: y, width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
}

export function GalaxyBackground() {
  const { width, height } = useWindowDimensions();
  const clock = useThemeClock();

  const stars = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        key: i,
        x: rand(i, 31, 0, 1) * width,
        y: rand(i, 32, 0, 1) * height,
        size: rand(i, 33, 1.2, 2.8),
        speed: rand(i, 34, 0.8, 2.4),
        phase: rand(i, 35, 0, Math.PI * 2),
        maxOpacity: rand(i, 36, 0.5, 0.95),
      })),
    [width, height],
  );

  return (
    <View pointerEvents="none" style={styles.layer} aria-hidden>
      <LinearGradient
        colors={[BASE_TOP, BASE_BOTTOM, BASE_TOP]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <NebulaBlob
        clock={clock}
        color={NEBULA_DEEP}
        w={width * 1.3}
        h={width * 0.75}
        baseX={-width * 0.25}
        baseY={height * 0.12}
        speed={0.16}
        phase={0}
        opacity={0.5}
        baseRotate={-18}
      />
      <NebulaBlob
        clock={clock}
        color={NEBULA_LAVENDER}
        w={width * 1.05}
        h={width * 0.55}
        baseX={width * 0.12}
        baseY={height * 0.5}
        speed={0.12}
        phase={2.4}
        opacity={0.38}
        baseRotate={22}
      />
      <NebulaBlob
        clock={clock}
        color={NEBULA_CORE}
        w={width * 0.7}
        h={width * 0.3}
        baseX={width * 0.2}
        baseY={height * 0.3}
        speed={0.2}
        phase={4.7}
        opacity={0.16}
        baseRotate={-30}
      />
      {stars.map(({ key, ...s }) => (
        <Star key={key} clock={clock} {...s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: BASE_TOP,
  },
  blob: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOpacity: 0.7,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
});
