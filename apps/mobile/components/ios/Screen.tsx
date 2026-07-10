import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';

import { ios } from '@/theme';

type ScreenBackground = 'system' | 'grouped';

type ScreenProps = {
  children: ReactNode;
  /** 'system' = systemBackground(일반 화면), 'grouped' = systemGroupedBackground(설정형 리스트). */
  background?: ScreenBackground;
  /** true면 ScrollView로 감싸고 large-title 헤더 아래 자동 인셋 적용. */
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
} & Pick<ScrollViewProps, 'refreshControl' | 'keyboardShouldPersistTaps' | 'onScroll' | 'scrollEventThrottle'>;

/**
 * 화면 루트 래퍼 — iOS 시스템 배경 + (선택) 네이티브 스크롤 인셋.
 *
 * `scroll`을 켜면 `contentInsetAdjustmentBehavior="automatic"`으로 large-title 네비게이션
 * 헤더/세이프에어리어에 맞춰 자동 인셋된다 (iOS 네이티브 스크롤 동작).
 */
export function Screen({
  children,
  background = 'system',
  scroll = false,
  contentContainerStyle,
  style,
  refreshControl,
  keyboardShouldPersistTaps,
  onScroll,
  scrollEventThrottle,
}: ScreenProps) {
  const backgroundColor = background === 'grouped' ? ios.systemGroupedBackground : ios.systemBackground;

  if (scroll) {
    return (
      <ScrollView
        style={[styles.flex, { backgroundColor }, style]}
        contentContainerStyle={contentContainerStyle}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={refreshControl}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}>
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.flex, { backgroundColor }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
