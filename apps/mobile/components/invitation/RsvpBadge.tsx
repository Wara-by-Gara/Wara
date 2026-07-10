/**
 * RSVP 상태 배지 — 참석/미정/불참을 연한 색 pill로 표시.
 * 앱 크롬 컴포넌트이므로 색상은 theme의 iOS 시스템 시맨틱 컬러만 사용.
 */

import { StyleSheet, Text, View } from 'react-native';

import { ios, iosMetrics, iosType } from '@/theme';
import type { RsvpStatus } from '@/api';

const CONFIG: Record<RsvpStatus, { label: string; color: typeof ios.systemGreen }> = {
  attending: { label: '참석', color: ios.systemGreen },
  undecided: { label: '미정', color: ios.systemOrange },
  absent: { label: '불참', color: ios.systemGray },
};

export function RsvpBadge({ status }: { status: RsvpStatus }) {
  const { label, color } = CONFIG[status];
  return (
    <View style={[styles.pill, { backgroundColor: ios.tertiarySystemFill }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[1],
    paddingVertical: 3,
    paddingHorizontal: iosMetrics.spacing[2],
    borderRadius: iosMetrics.radius.full,
  },
  dot: { width: 6, height: 6, borderRadius: iosMetrics.radius.full },
  label: { ...iosType.caption1, fontWeight: '600' },
});
