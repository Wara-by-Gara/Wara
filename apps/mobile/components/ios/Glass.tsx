import { View, type ViewProps } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { ios } from '@/theme';

export type GlassProps = ViewProps & {
  /** 글래스 스타일 (기본 'regular'). 'clear'는 더 투명한 변형. */
  glassStyle?: 'regular' | 'clear';
  /** 글래스에 입힐 틴트 (hex — SwiftUI/UIKit 경계라 PlatformColor 불가). */
  tintColor?: string;
  /** 터치에 반응하는 글래스 (버튼 배경 등). 동적 변경 불가 — 마운트 시 고정. */
  interactive?: boolean;
};

/**
 * iOS 26 Liquid Glass 서피스. 플로팅 크롬(오버레이 버튼·카드·바)에 사용.
 * iOS 26 미만에서는 시스템 배경색 View로 폴백.
 *
 * `@expo/ui`/`expo-glass-effect`는 반드시 이 래퍼를 경유한다 (CLAUDE.md).
 */
export function Glass({ glassStyle = 'regular', tintColor, interactive, style, children, ...rest }: GlassProps) {
  if (!isLiquidGlassAvailable()) {
    return (
      <View style={[{ backgroundColor: ios.secondarySystemBackground }, style]} {...rest}>
        {children}
      </View>
    );
  }
  return (
    <GlassView
      glassEffectStyle={glassStyle}
      tintColor={tintColor}
      isInteractive={interactive}
      style={style}
      {...rest}>
      {children}
    </GlassView>
  );
}

export { isLiquidGlassAvailable };
