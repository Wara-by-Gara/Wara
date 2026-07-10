import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ios, iosMetrics, iosType } from '@/theme';
import { haptics } from './Haptics';

export type SwipeAction = {
  label: string;
  onPress: () => void;
  /** systemRed 배경 (삭제 등). 기본은 systemBlue. */
  destructive?: boolean;
  background?: string;
};

type SwipeableRowProps = {
  children: ReactNode;
  rightActions: SwipeAction[];
};

const ACTION_WIDTH = 76;

/**
 * 좌→우 스와이프로 우측 액션(삭제/보관 등)을 노출하는 행.
 * RNGH `ReanimatedSwipeable` 기반. GestureHandlerRootView가 상위에 있어야 한다.
 */
export function SwipeableRow({ children, rightActions }: SwipeableRowProps) {
  const ref = useRef<SwipeableMethods>(null);

  const renderRightActions = () => (
    <View style={styles.actionsRow}>
      {rightActions.map((action, i) => (
        <Pressable
          key={i}
          onPress={() => {
            if (action.destructive) haptics.warning();
            else haptics.selection();
            ref.current?.close();
            action.onPress();
          }}
          style={[
            styles.action,
            { backgroundColor: action.background ?? (action.destructive ? ios.systemRed : ios.tint) },
          ]}>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row' },
  action: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: iosMetrics.spacing[2],
  },
  actionLabel: { ...iosType.footnote, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
});
