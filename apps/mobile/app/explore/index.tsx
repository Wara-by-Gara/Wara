// 공개 초대장 탐색 화면 — 정렬(최신/마감/인기)·카테고리 필터·카드 리스트(무한 스크롤).
// 탭하면 초대장 상세로 이동. 앱 크롬이므로 색상/메트릭은 theme 토큰과 킷만 사용.

import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';

import { Button, SegmentedControl } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import type { ExploreSort, PublicInvitationExplore } from '@/api/explore';
import { usePublicInvitations } from '@/hooks/queries/explore';

// 정렬 옵션 (웹 SORT_OPTIONS 포팅).
const SORTS: { key: ExploreSort; label: string }[] = [
  { key: 'latest', label: '최신' },
  { key: 'deadline', label: '마감' },
  { key: 'views', label: '인기' },
];

// 카테고리 (웹 recommendedEvents 포팅). 'all'은 필터 미적용.
const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'tech', label: '테크' },
  { key: 'fitness', label: '피트니스' },
  { key: 'food', label: '푸드' },
  { key: 'art', label: '예술' },
  { key: 'culture', label: '문화' },
  { key: 'health', label: '건강' },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label]),
);

function formatDate(iso: string | null): string {
  if (!iso) return '일정 미정';
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ExploreScreen() {
  const router = useRouter();
  const [sortIndex, setSortIndex] = useState(0);
  const [category, setCategory] = useState('all');

  const sort: ExploreSort = SORTS[sortIndex]?.key ?? 'latest';
  const query = usePublicInvitations(category === 'all' ? undefined : category, '', sort);

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  const header = (
    <View style={styles.headerWrap}>
      <SegmentedControl
        values={SORTS.map((s) => s.label)}
        selectedIndex={sortIndex}
        onChange={setSortIndex}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {CATEGORIES.map((c) => {
          const active = c.key === category;
          return (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const screenHeader = <Stack.Screen options={{ title: '탐색', headerLargeTitle: true }} />;

  if (query.isPending) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (query.error) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>공개 모임을 불러오지 못했어요</Text>
        <Button title="다시 시도" onPress={() => query.refetch()} />
      </View>
    );
  }

  return (
    <>
      {screenHeader}
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        renderItem={({ item }) => (
          <ExploreCard item={item} onPress={() => router.push(`/invitations/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>공개된 모임이 없어요</Text>
          </View>
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </>
  );
}

function ExploreCard({
  item,
  onPress,
}: {
  item: PublicInvitationExplore;
  onPress: () => void;
}) {
  const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {item.mainImageUrl ? (
        <Image source={{ uri: item.mainImageUrl }} style={styles.cardImage} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.cardImage, styles.cardImageFallback]}>
          <IconSymbol name="photo" size={28} color={ios.systemGray} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardCategory}>{categoryLabel}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {formatDate(item.eventStartAt)}
          {item.location ? ` · ${item.location}` : ''}
        </Text>
        <View style={styles.cardStats}>
          <View style={styles.stat}>
            <IconSymbol name="person.2.fill" size={12} color={ios.tertiaryLabel} />
            <Text style={styles.statText}>{item.participantCount}</Text>
          </View>
          <View style={styles.stat}>
            <IconSymbol name="eye.fill" size={12} color={ios.tertiaryLabel} />
            <Text style={styles.statText}>{item.viewCount}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemBackground,
  },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },
  list: { flex: 1, backgroundColor: ios.systemBackground },
  listContent: { paddingBottom: iosMetrics.spacing[8] },
  headerWrap: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingTop: iosMetrics.spacing[3],
    gap: iosMetrics.spacing[3],
  },
  chipsRow: { gap: iosMetrics.spacing[2], paddingRight: iosMetrics.pagePadding },
  chip: {
    paddingVertical: iosMetrics.spacing[1],
    paddingHorizontal: iosMetrics.spacing[3],
    borderRadius: iosMetrics.radius.full,
    backgroundColor: ios.tertiarySystemFill,
  },
  chipActive: { backgroundColor: ios.tint },
  chipText: { ...iosType.subhead, color: ios.label },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: iosMetrics.spacing[16] },
  emptyText: { ...iosType.subhead, color: ios.secondaryLabel },
  footer: { paddingVertical: iosMetrics.spacing[5] },
  card: {
    flexDirection: 'row',
    gap: iosMetrics.spacing[3],
    marginHorizontal: iosMetrics.pagePadding,
    marginTop: iosMetrics.spacing[4],
    padding: iosMetrics.spacing[3],
    borderRadius: iosMetrics.radius.lg,
    backgroundColor: ios.secondarySystemGroupedBackground,
  },
  cardPressed: { opacity: 0.7 },
  cardImage: { width: 84, height: 84, borderRadius: iosMetrics.radius.md },
  cardImageFallback: {
    backgroundColor: ios.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 2, justifyContent: 'center' },
  cardCategory: { ...iosType.caption1, fontWeight: '600', color: ios.tint },
  cardTitle: { ...iosType.headline, color: ios.label },
  cardMeta: { ...iosType.footnote, color: ios.secondaryLabel },
  cardStats: { flexDirection: 'row', gap: iosMetrics.spacing[4], marginTop: iosMetrics.spacing[1] },
  stat: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[1] },
  statText: { ...iosType.caption1, color: ios.tertiaryLabel },
});
