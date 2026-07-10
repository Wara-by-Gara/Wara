// 약관 전문 화면 — 웹 TermDetailContainer 미러.
// 활성 약관 목록(GET /terms, 비인증)에서 termType이 일치하는 활성 약관을 찾아 전문을 보여준다.

import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { fetchTerms, termsKeys } from '@/api';
import { Button, Screen } from '@/components/ios';
import { isTermDetailType, TERM_DETAIL_TITLE } from '@/constants/terms';
import { ios, iosMetrics, iosType } from '@/theme';

export default function TermDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const termType = isTermDetailType(type) ? type : null;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: termsKeys.list(),
    queryFn: ({ signal }) => fetchTerms(signal),
  });

  const term = termType ? (data ?? []).find((t) => t.termType === termType && t.isActive) : undefined;

  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: termType ? TERM_DETAIL_TITLE[termType] : '약관' }} />
      {isLoading ? (
        <Text style={styles.centerNote}>불러오는 중…</Text>
      ) : isError ? (
        <View style={styles.errorBlock}>
          <Text style={styles.centerNote}>약관을 불러올 수 없어요</Text>
          <Button title="다시 시도" variant="tinted" onPress={() => refetch()} />
        </View>
      ) : !term ? (
        <Text style={styles.centerNote}>등록된 약관이 없어요</Text>
      ) : (
        <>
          <Text style={styles.meta}>버전 {term.version}</Text>
          <View style={styles.card}>
            <Text style={styles.body}>{term.content}</Text>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
    gap: iosMetrics.spacing[3],
  },
  centerNote: {
    ...iosType.body,
    color: ios.secondaryLabel,
    textAlign: 'center',
    marginTop: iosMetrics.spacing[12],
  },
  errorBlock: { gap: iosMetrics.spacing[4] },
  meta: { ...iosType.footnote, color: ios.secondaryLabel, marginTop: iosMetrics.spacing[4] },
  card: {
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    padding: iosMetrics.spacing[4],
  },
  body: { ...iosType.body, color: ios.label },
});
