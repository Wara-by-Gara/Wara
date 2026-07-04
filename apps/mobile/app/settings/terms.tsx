// 약관·정책 전문 뷰어 — 활성 약관 목록(GET /terms, 비인증)에서 선택 → 전문 열람.
// 목록/상세를 한 화면에서 로컬 상태로 전환(선택 시 상세, 뒤로 시 목록).

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { fetchTerms, termsKeys, type ServiceTerm, type TermType } from '@/api';
import { Button, ListRow, ListSection, Screen } from '@/components/ios';
import { ios, iosMetrics, iosType } from '@/theme';

const TERM_TYPE_LABEL: Record<TermType, string> = {
  service: '서비스 이용약관',
  privacy: '개인정보 처리방침',
  marketing: '마케팅 정보 수신',
  location: '위치기반 서비스 약관',
};

export default function TermsScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: termsKeys.list(),
    queryFn: ({ signal }) => fetchTerms(signal),
  });

  if (isLoading) {
    return (
      <Screen background="grouped">
        <Text style={styles.centerNote}>불러오는 중…</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen background="grouped">
        <Text style={styles.centerNote}>약관을 불러오지 못했어요.</Text>
      </Screen>
    );
  }

  const terms = data ?? [];

  if (terms.length === 0) {
    return (
      <Screen background="grouped">
        <Text style={styles.centerNote}>표시할 약관이 없어요.</Text>
      </Screen>
    );
  }

  const selected = terms.find((t) => t.id === selectedId) ?? null;

  if (selected) {
    return <TermDetail term={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <Screen scroll background="grouped">
      <ListSection>
        {terms.map((term) => (
          <ListRow
            key={term.id}
            title={TERM_TYPE_LABEL[term.termType] ?? term.title}
            value={`v${term.version}`}
            accessory="chevron"
            onPress={() => setSelectedId(term.id)}
          />
        ))}
      </ListSection>
    </Screen>
  );
}

function TermDetail({ term, onBack }: { term: ServiceTerm; onBack: () => void }) {
  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.detailContent}>
      <Text style={styles.detailTitle}>{TERM_TYPE_LABEL[term.termType] ?? term.title}</Text>
      <Text style={styles.detailMeta}>버전 {term.version}</Text>
      <View style={styles.detailCard}>
        <Text style={styles.detailBody}>{term.content}</Text>
      </View>
      <Button title="목록으로" variant="tinted" onPress={onBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerNote: {
    ...iosType.body,
    color: ios.secondaryLabel,
    textAlign: 'center',
    marginTop: iosMetrics.spacing[12],
  },
  detailContent: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
    gap: iosMetrics.spacing[3],
  },
  detailTitle: { ...iosType.title2, fontWeight: '700', color: ios.label, marginTop: iosMetrics.spacing[4] },
  detailMeta: { ...iosType.footnote, color: ios.secondaryLabel },
  detailCard: {
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    padding: iosMetrics.spacing[4],
  },
  detailBody: { ...iosType.body, color: ios.label },
});
