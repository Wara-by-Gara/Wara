/**
 * 마스터피스 배경 — 웹 MasterpieceSlideLayer 의 RN 근사.
 * 웹 모바일 레이아웃 미러: 가운데 액자 1개 풀스크린, 6초마다 다음 명화로 회전(crossfade).
 * 명화 PNG(모바일 미번들)는 작품별 무드 팔레트 그라데이션으로 근사.
 */

import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { useThemeClock } from './themeClock';

const WALL_COLOR = '#2a1810'; // 웹 미술관 벽
const CANVAS_BG = '#1a0e08'; // 웹 .masterpiece-frame 내부

const ROTATE_INTERVAL_S = 6; // 웹 ROTATE_INTERVAL_MS 미러
const FADE_S = 0.7;

// 웹 FRAMES 5작품 → 무드 팔레트 근사 (모나리자/진주귀걸이/절규/고흐/비너스)
const ARTWORKS: { key: string; colors: [string, string, string] }[] = [
  { key: 'mona', colors: ['#6b6b3d', '#4a4426', '#2e2a18'] },
  { key: 'jinjugirl', colors: ['#27435c', '#152b3e', '#0e1c2a'] },
  { key: 'munk', colors: ['#d97a3d', '#8c4f46', '#40364d'] },
  { key: 'gohu', colors: ['#2b4a8c', '#4a6ab0', '#d9b93d'] },
  { key: 'vinus', colors: ['#79c4bd', '#a8d8cd', '#f2e3c9'] },
];

const CYCLE_S = ARTWORKS.length * ROTATE_INTERVAL_S;

function ArtworkLayer({
  clock,
  index,
  colors,
}: {
  clock: SharedValue<number>;
  index: number;
  colors: [string, string, string];
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const u = clock.value % CYCLE_S;
    const start = index * ROTATE_INTERVAL_S;
    let d = u - start;
    if (d < -CYCLE_S / 2) d += CYCLE_S;
    if (d > CYCLE_S / 2) d -= CYCLE_S;
    return {
      opacity: interpolate(
        d,
        [-FADE_S, 0, ROTATE_INTERVAL_S - FADE_S, ROTATE_INTERVAL_S],
        [0, 1, 1, 0],
      ),
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 상단 빛/하단 그늘 — 유화 무드 */}
      <LinearGradient
        colors={['rgba(255,244,214,0.18)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export function MasterpieceBackground() {
  const clock = useThemeClock();

  return (
    <View pointerEvents="none" style={styles.layer} aria-hidden>
      {/* 금색 바로크 액자 근사 — 이중 보더 */}
      <View style={styles.frameOuter}>
        <View style={styles.frameInner}>
          <View style={styles.canvas}>
            {ARTWORKS.map((art, i) => (
              <ArtworkLayer key={art.key} clock={clock} index={i} colors={art.colors} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: WALL_COLOR,
    padding: 18,
  },
  frameOuter: {
    flex: 1,
    borderWidth: 4,
    borderColor: '#8a6a2f',
    borderRadius: 6,
    backgroundColor: '#a8842e',
    padding: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  frameInner: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#c9a75a',
    borderRadius: 3,
    backgroundColor: CANVAS_BG,
    padding: 6,
  },
  canvas: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: CANVAS_BG,
  },
});
