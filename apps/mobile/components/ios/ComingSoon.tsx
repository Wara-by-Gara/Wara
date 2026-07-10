import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import type { SymbolViewProps } from 'expo-symbols';
import { Screen } from './Screen';

/** 아직 구현 전 탭/화면용 iOS 네이티브 플레이스홀더. */
export function ComingSoon({ title, icon }: { title: string; icon: SymbolViewProps['name'] }) {
  return (
    <Screen>
      <View style={styles.center}>
        <IconSymbol name={icon} size={44} color={ios.systemGray3} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>곧 준비됩니다.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: iosMetrics.spacing[2] },
  title: { ...iosType.title2, color: ios.label, marginTop: iosMetrics.spacing[2] },
  body: { ...iosType.subhead, color: ios.secondaryLabel },
});
