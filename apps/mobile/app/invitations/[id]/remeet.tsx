// 재모임(모임 복제) — 기존 초대장을 복사해 새 초대장을 만든다.
// 복제 범위: 제목(+"(복사본)")·소개·커버·디자인·RSVP 옵션·미션 여부는 복사, 날짜/참석자/조회수는 새로 시작,
// 공개 설정은 비공개로 초기화(서버 invitations.repository.clone 기준). 완료 시 새 초대장 상세로 replace.

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { WaraApiError } from '@/api';
import { Button, ListRow, ListSection, Screen } from '@/components/ios';
import { useCloneInvitation, useInvitation } from '@/hooks/queries/invitations';
import { ios, iosMetrics, iosType } from '@/theme';

function formatEventDate(iso: string | null): string {
  if (!iso) return '미정';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '미정';
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export default function RemeetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isPending, error } = useInvitation(id);
  const clone = useCloneInvitation();

  if (isPending) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '재모임 만들기' }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !data) {
    const message =
      error instanceof WaraApiError
        ? `${error.code} — 초대장을 불러오지 못했어요`
        : '네트워크 오류 — 잠시 후 다시 시도해 주세요';
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '오류' }} />
        <Text style={styles.errorTitle}>불러오기 실패</Text>
        <Text style={styles.errorBody}>{message}</Text>
      </View>
    );
  }

  const cloneError =
    clone.error instanceof WaraApiError
      ? `${clone.error.code} — 재모임을 만들지 못했어요`
      : clone.error
        ? '네트워크 오류 — 잠시 후 다시 시도해 주세요'
        : null;

  const handleClone = async () => {
    try {
      const created = await clone.mutateAsync(id);
      router.replace({ pathname: '/invitations/[id]', params: { id: created.id } });
    } catch {
      // 에러는 clone.error로 표시 (mutateAsync 재throw 무시)
    }
  };

  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: '재모임 만들기' }} />

      <Text style={styles.lead}>
        이 모임을 바탕으로 새 초대장을 만들어요. 날짜와 참석자는 새로 시작해요.
      </Text>

      <ListSection header="원본 모임">
        <ListRow title="제목" value={data.title} accessory="none" />
        <ListRow title="일정" value={formatEventDate(data.eventStartAt)} accessory="none" />
      </ListSection>

      <ListSection
        header="복제되는 항목"
        footer="날짜·참석자·조회수는 새로 시작하고, 공개 설정은 비공개로 초기화돼요.">
        <ListRow title="제목·소개" value="복사" accessory="none" />
        <ListRow title="커버·디자인" value="복사" accessory="none" />
        <ListRow title="RSVP 옵션" value="복사" accessory="none" />
      </ListSection>

      {cloneError ? <Text style={styles.cloneError}>{cloneError}</Text> : null}

      <View style={styles.cta}>
        <Button
          title="이 모임으로 재모임 만들기"
          onPress={handleClone}
          loading={clone.isPending}
          haptic="medium"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: iosMetrics.spacing[2] },
  content: {
    paddingBottom: iosMetrics.spacing[10],
  },
  lead: {
    ...iosType.body,
    color: ios.secondaryLabel,
    marginTop: iosMetrics.spacing[4],
    marginHorizontal: iosMetrics.pagePadding,
  },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.footnote, color: ios.secondaryLabel, textAlign: 'center', paddingHorizontal: iosMetrics.spacing[6] },
  cloneError: {
    ...iosType.footnote,
    color: ios.systemRed,
    marginTop: iosMetrics.spacing[4],
    marginHorizontal: iosMetrics.pagePadding,
  },
  cta: {
    marginTop: iosMetrics.spacing[6],
    marginHorizontal: iosMetrics.pagePadding,
  },
});
