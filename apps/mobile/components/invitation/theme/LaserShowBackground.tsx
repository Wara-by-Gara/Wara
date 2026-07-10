/**
 * 레이저쇼 배경 — 웹 LaserShowBackground(빔 셰이더)의 RN 근사.
 * 어두운 남색 베이스 + 하단 중앙 원점에서 스윙하는 빔 6개(셰이더 각도/속도/색 미러) + 원점 glow.
 */

import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { useThemeClock } from './themeClock';

const BASE_TOP = '#050517';
const BASE_BOTTOM = '#0a0a2e';

interface BeamSpec {
  key: number;
  baseAngle: number; // 셰이더 각도(deg, 동쪽 기준 CCW)
  swing: number; // deg
  speed: number;
  phase: number;
  color: string;
}

// 셰이더 빔 6개 미러: (138,17,.34) violet / (118,13,.51) blue / (99,9,.67) cyan /
// (81,11,.46) green / (64,13,.58) teal / (48,17,.41) purple
const BEAMS: BeamSpec[] = [
  { key: 0, baseAngle: 138, swing: 17, speed: 0.34, phase: 0.0, color: '#8c21ff' },
  { key: 1, baseAngle: 118, swing: 13, speed: 0.51, phase: 1.1, color: '#2e59ff' },
  { key: 2, baseAngle: 99, swing: 9, speed: 0.67, phase: 2.2, color: '#00deff' },
  { key: 3, baseAngle: 81, swing: 11, speed: 0.46, phase: 3.4, color: '#00ff54' },
  { key: 4, baseAngle: 64, swing: 13, speed: 0.58, phase: 1.7, color: '#00ffbf' },
  { key: 5, baseAngle: 48, swing: 17, speed: 0.41, phase: 4.3, color: '#cc33ff' },
];

function Beam({
  clock,
  spec,
  width,
  height,
}: {
  clock: SharedValue<number>;
  spec: BeamSpec;
  width: number;
  height: number;
}) {
  const beamLen = height * 1.35;
  const glowW = 22;

  const animatedStyle = useAnimatedStyle(() => {
    const shaderAngle = spec.baseAngle + spec.swing * Math.sin(clock.value * spec.speed + spec.phase);
    // 셰이더(동쪽 기준 CCW, y-up) → RN rotate(수직 빔 기준 시계방향)
    return {
      transform: [{ rotate: `${90 - shaderAngle}deg` }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.beam,
        {
          width: glowW,
          height: beamLen,
          left: width / 2 - glowW / 2,
          bottom: -8,
          transformOrigin: '50% 100%',
        },
        animatedStyle,
      ]}
    >
      {/* glow (넓고 옅게) */}
      <LinearGradient
        colors={[`${spec.color}00`, `${spec.color}40`]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* core (좁고 밝게) */}
      <View style={styles.coreWrap}>
        <LinearGradient
          colors={[`${spec.color}00`, `${spec.color}e6`]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.core}
        />
      </View>
    </Animated.View>
  );
}

export function LaserShowBackground() {
  const { width, height } = useWindowDimensions();
  const clock = useThemeClock();
  const glowSize = width * 0.34;

  return (
    <View pointerEvents="none" style={styles.layer} aria-hidden>
      <LinearGradient
        colors={[BASE_TOP, BASE_BOTTOM]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {BEAMS.map((spec) => (
        <Beam key={spec.key} clock={clock} spec={spec} width={width} height={height} />
      ))}
      {/* 하단 앰비언트 블루 */}
      <LinearGradient
        colors={['rgba(26,26,77,0)', 'rgba(40,45,120,0.5)']}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 원점 glow — 밝은 화이트-블루 포인트 */}
      <View
        style={[
          styles.originGlow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            left: width / 2 - glowSize / 2,
            bottom: -glowSize / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: BASE_TOP,
  },
  beam: {
    position: 'absolute',
    alignItems: 'center',
  },
  coreWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  core: {
    width: 3,
    height: '100%',
  },
  originGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(190,205,255,0.85)',
    shadowColor: '#a6bfff',
    shadowOpacity: 1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
});
