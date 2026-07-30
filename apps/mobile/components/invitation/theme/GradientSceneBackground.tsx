/**
 * 그라데이션 배경 (bg-invite-grad-*) — 웹 GradientScene 의 c1/c2 를 expo-linear-gradient 로 미러.
 * 웹의 캔버스 장면(태양/번개/축구 등)은 c1/c2 기반 drift 그라데이션 + 광원 orb 로 근사.
 */

import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import type { GradientColors } from '@/constants/invitationTheme';
import { useThemeClock } from './themeClock';

const PLANE_DRIFT_S = 8; // 웹 grad-drift 8s ease-in-out infinite

function DriftingPlane({
  clock,
  c1,
  c2,
  width,
  height,
}: {
  clock: SharedValue<number>;
  c1: string;
  c2: string;
  width: number;
  height: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const p = (clock.value % PLANE_DRIFT_S) / PLANE_DRIFT_S;
    // ease-in-out 왕복 (0 → 1 → 0)
    const wave = (1 - Math.cos(p * Math.PI * 2)) / 2;
    return {
      transform: [
        { translateX: -wave * width * 0.5 },
        { translateY: -wave * height * 0.25 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.plane, { width: width * 1.5, height: height * 1.25 }, animatedStyle]}>
      <LinearGradient
        colors={[c1, c2, c1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function Orb({
  clock,
  color,
  size,
  baseX,
  baseY,
  speed,
  phase,
}: {
  clock: SharedValue<number>;
  color: string;
  size: number;
  baseX: number;
  baseY: number;
  speed: number;
  phase: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const t = clock.value * speed + phase;
    return {
      transform: [
        { translateX: baseX + Math.sin(t) * size * 0.3 },
        { translateY: baseY + Math.cos(t * 0.8) * size * 0.22 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.orb,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export function GradientSceneBackground({ variant }: { variant: GradientColors }) {
  const { width, height } = useWindowDimensions();
  const clock = useThemeClock();

  return (
    <View pointerEvents="none" style={styles.layer} aria-hidden>
      <DriftingPlane clock={clock} c1={variant.c1} c2={variant.c2} width={width} height={height} />
      <Orb
        clock={clock}
        color={variant.c2}
        size={width * 0.8}
        baseX={-width * 0.15}
        baseY={height * 0.1}
        speed={0.35}
        phase={0}
      />
      <Orb
        clock={clock}
        color={variant.c1}
        size={width * 0.65}
        baseX={width * 0.45}
        baseY={height * 0.55}
        speed={0.28}
        phase={2.1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  plane: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  orb: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0.35,
  },
});
