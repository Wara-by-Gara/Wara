// FAQ 화면 — 활성 FAQ 목록 + 클라이언트 검색(질문/답변 부분일치).
// 각 항목은 탭하면 답변이 펼쳐지는 아코디언. (백엔드에 카테고리 없음 → 검색만 제공.)

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen, haptics } from '@/components/ios';
import { useFaq } from '@/hooks/queries/faq';
import { ios, iosMetrics, iosType } from '@/theme';
import type { FaqItem } from '@/api/faq';

export default function FaqScreen() {
  const { data, isLoading, isError } = useFaq();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const items = useMemo(() => {
    const all = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (it) => it.question.toLowerCase().includes(q) || it.answer.toLowerCase().includes(q),
    );
  }, [data, query]);

  return (
    <Screen scroll background="grouped" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <TextInput
        style={styles.search}
        placeholder="질문 검색"
        placeholderTextColor={ios.tertiaryLabel}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      {isLoading ? (
        <Text style={styles.note}>불러오는 중…</Text>
      ) : isError ? (
        <Text style={styles.note}>FAQ를 불러오지 못했어요.</Text>
      ) : items.length === 0 ? (
        <Text style={styles.note}>{query.trim() ? '검색 결과가 없어요.' : '등록된 FAQ가 없어요.'}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <FaqCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => {
                haptics.selection();
                setExpandedId((prev) => (prev === item.id ? null : item.id));
              }}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function FaqCard({ item, expanded, onToggle }: { item: FaqItem; expanded: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.questionRow}>
        <Text style={styles.question}>{item.question}</Text>
        <IconSymbol
          name={expanded ? 'chevron.up' : 'chevron.down'}
          size={14}
          color={ios.tertiaryLabel}
          weight="semibold"
        />
      </View>
      {expanded ? <Text style={styles.answer}>{item.answer}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
    gap: iosMetrics.spacing[3],
  },
  search: {
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.md,
    paddingHorizontal: iosMetrics.spacing[4],
    paddingVertical: iosMetrics.spacing[3],
    ...iosType.body,
    color: ios.label,
    marginTop: iosMetrics.spacing[3],
  },
  list: { gap: iosMetrics.spacing[3] },
  card: {
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    padding: iosMetrics.spacing[4],
    gap: iosMetrics.spacing[2],
  },
  cardPressed: { opacity: 0.6 },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[3] },
  question: { ...iosType.headline, color: ios.label, flex: 1 },
  answer: { ...iosType.subhead, color: ios.secondaryLabel },
  note: {
    ...iosType.body,
    color: ios.secondaryLabel,
    textAlign: 'center',
    marginTop: iosMetrics.spacing[10],
  },
});
