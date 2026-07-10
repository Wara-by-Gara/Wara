// 홈 탭 = 다가오는 모임(가로 카드) + 활동 피드(무한 스크롤).
// 활동 피드는 서버가 초대장 단위라 내 초대장들을 병합한 홈 피드(useHomeActivityFeed).
// 앱 크롬이므로 색상/메트릭은 theme 토큰과 components/ios 킷만 사용(hex 금지, on-tint 글리프 제외).
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type OpaqueColorValue,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SymbolViewProps } from 'expo-symbols';

import { haptics } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError } from '@/api';
import type { InvitationListItem } from '@/api/invitations';
import type { ActivityType } from '@/api/activityEvents';
import { useMyInvitations } from '@/hooks/queries/invitations';
import { useHomeActivityFeed, type HomeActivityItem } from '@/hooks/queries/activityEvents';

// 활동 타입 → SF Symbol (원형 배경 아이콘).
type IconSpec = { name: SymbolViewProps['name']; tint: string | OpaqueColorValue };

const TYPE_ICON: Record<ActivityType, IconSpec> = {
  participant_joined: { name: 'person.badge.plus', tint: ios.systemGreen },
  photo_uploaded: { name: 'photo.fill', tint: ios.systemBlue },
  comment_added: { name: 'bubble.left.fill', tint: ios.systemBlue },
  vote_confirmed: { name: 'checkmark.circle.fill', tint: ios.systemOrange },
};

/** data는 Record<string, unknown> — 문자열 필드만 안전하게 읽는다. */
function readString(data: Record<string, unknown>, key: string): string | null {
  const v = data[key];
  return typeof v === 'string' ? v : null;
}

function actorName(item: HomeActivityItem): string {
  return item.actor?.nickname ?? item.actor?.name ?? '누군가';
}

function activityText(item: HomeActivityItem): string {
  switch (item.type) {
    case 'participant_joined':
      return `${actorName(item)}님이 참여했어요`;
    case 'photo_uploaded':
      return `${actorName(item)}님이 사진을 올렸어요`;
    case 'comment_added': {
      const excerpt = readString(item.data, 'excerpt');
      return excerpt ? `${actorName(item)}님: ${excerpt}` : `${actorName(item)}님이 댓글을 남겼어요`;
    }
    case 'vote_confirmed': {
      const title = readString(item.data, 'title');
      return title ? `일정이 확정됐어요 · ${title}` : '일정이 확정됐어요';
    }
  }
}

/** WaraApiError.code 인라인 매핑. */
function messageForError(err: unknown): string {
  if (err instanceof WaraApiError) {
    if (err.code === 'INVITATION_NOT_FOUND') return '모임을 찾을 수 없어요';
    if (err.code === 'INVITATION_ACCESS_REVOKED') return '접근 권한이 없어요';
  }
  return '활동을 불러오지 못했어요';
}

/** 상대 시간 표기 (방금 / n분 전 / n시간 전 / n일 전 / 날짜). */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return '방금';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function formatEventDate(iso: string | null): string {
  if (!iso) return '일정 미정';
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const invitationsQuery = useMyInvitations();

  // 활동 피드는 내 모든 초대장을 대상으로 병합.
  const invitationIds = useMemo(
    () => (invitationsQuery.data ?? []).map((inv) => inv.id),
    [invitationsQuery.data],
  );
  const feedQuery = useHomeActivityFeed(invitationIds);
  const feedItems = feedQuery.data?.pages.flatMap((p) => p.items) ?? [];

  // 다가오는 모임: eventStartAt이 미래인 것만 임박 순.
  const upcoming = useMemo(() => {
    const now = Date.now();
    return (invitationsQuery.data ?? [])
      .filter((inv) => inv.eventStartAt !== null && new Date(inv.eventStartAt).getTime() >= now)
      .sort((a, b) => ((a.eventStartAt as string) < (b.eventStartAt as string) ? -1 : 1))
      .slice(0, 10);
  }, [invitationsQuery.data]);

  const goInvitation = useCallback(
    (id: string) => {
      haptics.selection();
      router.push(`/invitations/${id}`);
    },
    [router],
  );

  const refreshing = invitationsQuery.isRefetching || feedQuery.isRefetching;
  const onRefresh = useCallback(() => {
    invitationsQuery.refetch();
    feedQuery.refetch();
  }, [invitationsQuery, feedQuery]);

  const titleBar = (
    <View style={[styles.header, { paddingTop: insets.top + iosMetrics.spacing[3] }]}>
      <Text style={styles.title}>홈</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="알림"
        onPress={() => {
          haptics.selection();
          router.push('/notifications');
        }}
        hitSlop={8}>
        <IconSymbol name="bell" size={24} color={ios.tint} />
      </Pressable>
    </View>
  );

  // 초대장 로딩 전에는 피드 대상도 미확정 → 전체 스피너.
  if (invitationsQuery.isPending) {
    return (
      <View style={styles.screen}>
        {titleBar}
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  const listHeader = (
    <View>
      {titleBar}
      {upcoming.length > 0 ? (
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionLabel}>다가오는 모임</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.upcomingRow}>
            {upcoming.map((inv) => (
              <UpcomingCard key={inv.id} item={inv} onPress={() => goInvitation(inv.id)} />
            ))}
          </ScrollView>
        </View>
      ) : null}
      <Text style={[styles.sectionLabel, styles.feedLabel]}>활동</Text>
    </View>
  );

  const empty = feedQuery.isError ? (
    <View style={styles.center}>
      <IconSymbol name="exclamationmark.triangle" size={40} color={ios.tertiaryLabel} />
      <Text style={styles.emptyBody}>{messageForError(feedQuery.error)}</Text>
      <Pressable onPress={() => feedQuery.refetch()} hitSlop={8}>
        <Text style={styles.retry}>다시 시도</Text>
      </Pressable>
    </View>
  ) : feedQuery.isPending && invitationIds.length > 0 ? (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  ) : (
    <View style={styles.center}>
      <IconSymbol name="sparkles" size={40} color={ios.tertiaryLabel} />
      <Text style={styles.emptyBody}>
        {invitationIds.length === 0 ? '아직 모임이 없어요' : '아직 활동이 없어요'}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={feedItems}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <ActivityRow item={item} onPress={() => goInvitation(item.invitationId)} />}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={empty}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) feedQuery.fetchNextPage();
        }}
        ListFooterComponent={
          feedQuery.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function ActivityRow({ item, onPress }: { item: HomeActivityItem; onPress: () => void }) {
  const icon = TYPE_ICON[item.type];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.iconWrap, { backgroundColor: icon.tint }]}>
        <IconSymbol name={icon.name} size={17} color="#FFFFFF" />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowContent} numberOfLines={2}>
          {activityText(item)}
        </Text>
        <Text style={styles.rowTime}>{relativeTime(item.occurredAt)}</Text>
      </View>
    </Pressable>
  );
}

function UpcomingCard({ item, onPress }: { item: InvitationListItem; onPress: () => void }) {
  const uri = item.mainImageThumbnailUrl ?? item.mainImageUrl;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.upcomingCard, pressed && styles.cardPressed]}>
      {uri ? (
        <Image source={{ uri }} style={styles.upcomingImage} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.upcomingImage, styles.upcomingImageFallback]}>
          <IconSymbol name="calendar" size={28} color={ios.systemGray} />
        </View>
      )}
      <Text style={styles.upcomingTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.upcomingDate} numberOfLines={1}>
        {formatEventDate(item.eventStartAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ios.systemBackground },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[2],
  },
  title: { ...iosType.largeTitle, color: ios.label },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[16],
  },
  listContent: { flexGrow: 1, paddingBottom: iosMetrics.spacing[8] },
  emptyBody: { ...iosType.subhead, color: ios.secondaryLabel },
  retry: { ...iosType.body, color: ios.tint },
  sectionLabel: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginHorizontal: iosMetrics.pagePadding,
    marginBottom: iosMetrics.spacing[2],
  },
  feedLabel: { marginTop: iosMetrics.spacing[5] },
  upcomingSection: { marginTop: iosMetrics.spacing[2] },
  upcomingRow: { gap: iosMetrics.spacing[3], paddingHorizontal: iosMetrics.pagePadding },
  upcomingCard: { width: 150 },
  cardPressed: { opacity: 0.7 },
  upcomingImage: {
    width: 150,
    height: 96,
    borderRadius: iosMetrics.radius.lg,
    marginBottom: iosMetrics.spacing[2],
  },
  upcomingImageFallback: {
    backgroundColor: ios.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingTitle: { ...iosType.subhead, fontWeight: '600', color: ios.label },
  upcomingDate: { ...iosType.caption1, color: ios.secondaryLabel, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.pagePadding,
    paddingVertical: iosMetrics.spacing[3],
    minHeight: iosMetrics.rowMinHeight,
    backgroundColor: ios.systemBackground,
  },
  rowPressed: { backgroundColor: ios.systemFill },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: iosMetrics.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowContent: { ...iosType.subhead, color: ios.label },
  rowTime: { ...iosType.caption1, color: ios.secondaryLabel },
  separator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: iosMetrics.pagePadding + 32 + iosMetrics.spacing[3],
  },
  footer: { paddingVertical: iosMetrics.spacing[4] },
});
