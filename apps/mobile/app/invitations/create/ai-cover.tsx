/**
 * 초대장 생성 4단계 — AI 커버(플레이스홀더).
 * 실제 AI 이미지 생성 연동은 후속 작업. 지금은 안내 문구 + '건너뛰기'만 제공한다.
 * TODO: useAiCover 훅 연동 (다른 에이전트 작업 완료 후) — 지금은 import 금지.
 */

import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';

export default function AiCoverStep() {
  const router = useRouter();

  return (
    <Screen background="grouped">
      <View style={styles.content}>
        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <IconSymbol name="sparkles" size={44} color={ios.tint} />
          </View>
          <Text style={styles.title}>AI 커버 만들기</Text>
          <Text style={styles.subtitle}>
            곧 AI로 모임 분위기에 맞는 커버 이미지를 만들 수 있어요. 지금은 템플릿 기본 커버로
            진행할게요.
          </Text>
        </View>

        <Button
          title="건너뛰기"
          variant="tinted"
          onPress={() => router.push('/invitations/create/rsvp')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[4],
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: iosMetrics.radius.full,
    backgroundColor: ios.tertiarySystemFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...iosType.title2,
    fontWeight: '700',
    color: ios.label,
  },
  subtitle: {
    ...iosType.subhead,
    color: ios.secondaryLabel,
    textAlign: 'center',
    paddingHorizontal: iosMetrics.spacing[6],
  },
});
