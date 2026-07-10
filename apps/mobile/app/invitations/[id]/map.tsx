// 실시간 위치 공유 화면 (iOS 네이티브) — 내 위치 공유 토글 + 지도 + 프라이버시 티어.
// 지도/참가자 위치/모임 장소 표시 및 위치 발행은 MapContainer가 담당한다.
// MapContainer는 mount 시 useLocation+useLocationSocket으로 내 위치를 자동 발행하므로,
// "내 위치 공유" 토글은 MapContainer의 mount/unmount로 발행 on/off를 실제 제어한다.
// (MapContainer/useLocation/useLocationSocket는 수정 금지 대상이라 그대로 재사용.)
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapContainer from '@/components/MapContainer';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SegmentedControl } from '@/components/ios';
import { ios, iosMetrics, iosType } from '@/theme';

// 프라이버시 티어. api/locations에 티어 endpoint가 없어 현재는 로컬 UI 상태만 유지한다.
// TODO(server): 티어 저장/조회 endpoint 연동 및 서버측 위치 마스킹(거리만/비공개) 적용.
const TIERS = ['완전 공유', '거리만', '비공개'] as const;

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // 위치 공유는 opt-in(F-QOHBNO 활성화 토글) — 기본 off.
  const [sharing, setSharing] = useState(false);
  const [tierIndex, setTierIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '위치 공유' }} />

      <View style={styles.mapArea}>
        {sharing ? (
          // MapContainer가 내부적으로 권한 확인/거부·연결·에러 상태를 처리한다.
          <MapContainer invitationId={id} />
        ) : (
          <View style={styles.resting}>
            <IconSymbol name="location.slash.fill" size={40} color={ios.tertiaryLabel} />
            <Text style={styles.restingTitle}>위치 공유가 꺼져 있어요</Text>
            <Text style={styles.restingBody}>
              공유를 켜면 지도에서 참가자 위치와 모임 장소를 볼 수 있어요.
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + iosMetrics.spacing[4] }]}>
        <Text style={styles.sectionHeader}>내 위치</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>위치 공유</Text>
            <Switch value={sharing} onValueChange={setSharing} />
          </View>
        </View>
        <Text style={styles.footnote}>
          위치는 약 5초 간격으로 갱신돼요. 공유를 끄면 배터리 사용을 줄일 수 있어요.
        </Text>

        <Text style={[styles.sectionHeader, styles.sectionGap]}>공유 범위</Text>
        <SegmentedControl
          values={[...TIERS]}
          selectedIndex={tierIndex}
          onChange={setTierIndex}
          style={styles.segment}
        />
        <Text style={styles.footnote}>거리만·비공개는 서버 연동 후 적용돼요.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ios.systemGroupedBackground },
  mapArea: { flex: 1 },
  resting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.spacing[8],
    backgroundColor: ios.systemBackground,
  },
  restingTitle: { ...iosType.headline, color: ios.label, textAlign: 'center' },
  restingBody: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },

  panel: {
    paddingTop: iosMetrics.spacing[4],
    backgroundColor: ios.systemGroupedBackground,
    borderTopWidth: iosMetrics.hairline,
    borderTopColor: ios.separator,
  },
  sectionHeader: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginBottom: iosMetrics.spacing[2],
    marginHorizontal: iosMetrics.groupedInset + iosMetrics.spacing[1],
  },
  sectionGap: { marginTop: iosMetrics.spacing[5] },
  card: {
    marginHorizontal: iosMetrics.groupedInset,
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    overflow: 'hidden',
  },
  row: {
    minHeight: iosMetrics.rowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: iosMetrics.spacing[4],
    paddingVertical: iosMetrics.spacing[2],
  },
  rowTitle: { ...iosType.body, color: ios.label },
  segment: { marginHorizontal: iosMetrics.groupedInset },
  footnote: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginTop: iosMetrics.spacing[2],
    marginHorizontal: iosMetrics.groupedInset + iosMetrics.spacing[1],
  },
});
