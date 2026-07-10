/**
 * 파티클 엔진 — 웹 InvitationAnimation.tsx 의 CONFIG/buildParticles 를 RN으로 미러.
 * 레이어당 클록 SharedValue 1개, 파티클별 useAnimatedStyle(UI 스레드 worklet)로 위치 계산.
 */

import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { TextStyle, ViewStyle } from 'react-native';

import { rand, useThemeClock } from './themeClock';

export type ParticleAnimKind = 'fall' | 'confetti' | 'rise' | 'drift' | 'twinkle';
export type ParticleVisual = 'petal' | 'confetti' | 'bubble' | 'emoji' | 'star';

export interface ParticleEffectConfig {
  anim: ParticleAnimKind;
  visual: ParticleVisual;
  count: number;
  size: [number, number];
  duration: [number, number];
  drift: [number, number];
  opacity: [number, number];
  emojis?: string[];
  colors?: string[];
  tilt?: [number, number];
  spin?: boolean;
}

interface ParticleSpec {
  key: number;
  anim: ParticleAnimKind;
  x: number; // 0~1 (수평 기준 위치, drift는 수직 기준)
  y: number; // 0~1 (twinkle/drift 전용)
  size: number;
  duration: number;
  phase: number;
  drift: number;
  opacity: number;
  spin: number;
  tilt: number;
  emoji: string | null;
  bodyStyle: ViewStyle;
  textStyle: TextStyle | null;
}

function buildBodyStyle(
  cfg: ParticleEffectConfig,
  i: number,
  size: number,
): { body: ViewStyle; text: TextStyle | null } {
  if (cfg.visual === 'emoji') {
    return { body: {}, text: { fontSize: size, lineHeight: size * 1.15 } };
  }
  if (cfg.visual === 'petal') {
    const color = cfg.colors?.[i % cfg.colors.length] ?? '#ffffff';
    return {
      body: {
        width: size,
        height: size * 1.35,
        backgroundColor: color,
        borderTopLeftRadius: size / 2,
        borderTopRightRadius: 0,
        borderBottomRightRadius: size / 2,
        borderBottomLeftRadius: size / 2,
      },
      text: null,
    };
  }
  if (cfg.visual === 'confetti') {
    const color = cfg.colors?.[i % cfg.colors.length] ?? '#ff6db3';
    return {
      body: {
        width: size * 0.6,
        height: size,
        backgroundColor: color,
        borderRadius: 1,
      },
      text: null,
    };
  }
  if (cfg.visual === 'bubble') {
    return {
      body: {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
        backgroundColor: 'rgba(255,255,255,0.08)',
      },
      text: null,
    };
  }
  // star
  return {
    body: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: 'rgba(255,255,255,0.9)',
      shadowColor: '#ffffff',
      shadowOpacity: 0.6,
      shadowRadius: size * 0.6,
      shadowOffset: { width: 0, height: 0 },
    },
    text: null,
  };
}

function buildSpecs(cfg: ParticleEffectConfig): ParticleSpec[] {
  return Array.from({ length: cfg.count }, (_, i) => {
    const size = rand(i, 1, cfg.size[0], cfg.size[1]);
    const duration = rand(i, 2, cfg.duration[0], cfg.duration[1]);
    const { body, text } = buildBodyStyle(cfg, i, size);
    return {
      key: i,
      anim: cfg.anim,
      x: rand(i, 7, 0, 1),
      y: cfg.anim === 'twinkle' ? rand(i, 8, 0, 1) : rand(i, 8, 0.06, 0.9),
      size,
      duration,
      phase: rand(i, 9, 0, duration),
      drift: rand(i, 3, cfg.drift[0], cfg.drift[1]),
      opacity: rand(i, 4, cfg.opacity[0], cfg.opacity[1]),
      spin: cfg.spin === false ? 0 : rand(i, 5, 120, 720),
      tilt: cfg.tilt ? rand(i, 6, cfg.tilt[0], cfg.tilt[1]) : 0,
      emoji: cfg.visual === 'emoji' && cfg.emojis ? (cfg.emojis[i % cfg.emojis.length] ?? null) : null,
      bodyStyle: body,
      textStyle: text,
    };
  });
}

function Particle({
  clock,
  spec,
  width,
  height,
}: {
  clock: SharedValue<number>;
  spec: ParticleSpec;
  width: number;
  height: number;
}) {
  const { anim, x, y, size, duration, phase, drift, opacity, spin, tilt } = spec;

  const animatedStyle = useAnimatedStyle(() => {
    const p = ((clock.value + phase) % duration) / duration;

    if (anim === 'twinkle') {
      const tw = (Math.sin(p * Math.PI * 2) + 1) / 2;
      return {
        transform: [
          { translateX: x * width },
          { translateY: y * height },
          { scale: 0.7 + tw * 0.45 },
        ],
        opacity: opacity * (0.25 + tw * 0.75),
      };
    }

    if (anim === 'drift') {
      const fromX = -0.25 * width;
      const toX = 1.1 * width;
      return {
        transform: [
          { translateX: fromX + p * (toX - fromX) },
          { translateY: y * height + Math.sin(p * Math.PI * 4) * 10 },
        ],
        opacity: interpolate(p, [0, 0.06, 0.92, 1], [0, opacity, opacity, 0]),
      };
    }

    // fall / confetti / rise — 수직 이동 + 수평 drift + 회전
    const startY = anim === 'rise' ? height + size : -size * 1.5;
    const endY = anim === 'rise' ? -size * 1.5 : height + size;
    const sway = anim === 'confetti' ? Math.sin(p * Math.PI * 6) * 14 : Math.sin(p * Math.PI * 2) * 8;
    return {
      transform: [
        { translateX: x * width + p * drift + sway },
        { translateY: startY + p * (endY - startY) },
        { rotate: `${tilt + p * spin}deg` },
      ],
      opacity: interpolate(p, [0, 0.05, 0.9, 1], [0, opacity, opacity, 0]),
    };
  });

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      {spec.emoji ? (
        <Text allowFontScaling={false} style={spec.textStyle}>
          {spec.emoji}
        </Text>
      ) : (
        <View style={spec.bodyStyle} />
      )}
    </Animated.View>
  );
}

export function ParticleField({ config }: { config: ParticleEffectConfig }) {
  const { width, height } = useWindowDimensions();
  const clock = useThemeClock();
  const specs = useMemo(() => buildSpecs(config), [config]);

  return (
    <View pointerEvents="none" style={styles.layer} aria-hidden>
      {specs.map((spec) => (
        <Particle key={spec.key} clock={clock} spec={spec} width={width} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
