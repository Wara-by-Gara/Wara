// 만들기 탭 — 초대장 생성 진입 화면 (웹 하단 네비 FAB '만들기'의 모바일 대응).
// 실제 생성은 기존 모달 마법사(/invitations/create)로 진입한다.
// 앱 크롬 — theme 토큰 + components/ios 킷만 사용.
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';

export default function CreateTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + iosMetrics.spacing[3] }]}>
        <Text style={styles.title}>만들기</Text>
      </View>
      <View style={styles.center}>
        <IconSymbol name="envelope.open.fill" size={44} color={ios.tint} />
        <Text style={styles.headline}>새로운 모임을 시작해요</Text>
        <Text style={styles.body}>
          템플릿을 고르고 정보를 채우면{'\n'}바로 공유할 수 있는 초대장이 완성돼요.
        </Text>
        <Button
          title="초대장 만들기"
          onPress={() => router.push('/invitations/create')}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ios.systemBackground },
  header: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[2],
  },
  title: { ...iosType.largeTitle, color: ios.label },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
  },
  headline: { ...iosType.title2, color: ios.label, marginTop: iosMetrics.spacing[2] },
  body: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },
  cta: { alignSelf: 'stretch', marginTop: iosMetrics.spacing[4] },
});
