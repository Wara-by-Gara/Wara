// 알림 화면 = in-app 알림 목록 (Phase 4). 소켓 실시간 수신 + 커서 무한 스크롤.
// 루트 스택 화면(네이티브 헤더 '알림') — 홈 탭 타이틀바 우측 종 버튼으로 진입.
// 앱 크롬이므로 색상/메트릭은 theme 토큰과 components/ios 킷만 사용(hex 금지).
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type OpaqueColorValue,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { SymbolViewProps } from 'expo-symbols';

import { SwipeableRow, haptics } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError } from '@/api';
import {
  notificationKeys,
  type Notification,
  type NotificationType,
  type NotificationsPage,
} from '@/api/notifications';
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from '@/hooks/queries/notifications';
import { useNotificationSocket } from '@/hooks/socket/useNotificationSocket';

// 알림 타입 → SF Symbol (앞쪽 원형 배경 아이콘).
type IconSpec = { name: SymbolViewProps['name']; tint: string | OpaqueColorValue };

const TYPE_ICON: Record<NotificationType, IconSpec> = {
  remind: { name: 'bell.fill', tint: ios.systemOrange },
  participantLocations: { name: 'location.fill', tint: ios.systemBlue },
  eventLocations: { name: 'mappin.and.ellipse', tint: ios.systemBlue },
  feedback: { name: 'bubble.left.fill', tint: ios.systemBlue },
  invitation_date: { name: 'calendar', tint: ios.systemRed },
  photo: { name: 'photo.fill', tint: ios.systemGreen },
  arrived: { name: 'figure.walk', tint: ios.systemGreen },
  nudge: { name: 'hand.wave.fill', tint: ios.systemOrange },
  vote_reminder: { name: 'calendar.badge.clock', tint: ios.systemOrange },
  vote_tied: { name: 'equal.circle.fill', tint: ios.systemOrange },
  vote_confirmed: { name: 'checkmark.circle.fill', tint: ios.systemGreen },
  ai_complete: { name: 'sparkles', tint: ios.systemBlue },
  mention: { name: 'at', tint: ios.systemBlue },
  participant_joined: { name: 'person.badge.plus', tint: ios.systemGreen },
  text_blast: { name: 'megaphone.fill', tint: ios.systemRed },
  message: { name: 'message.fill', tint: ios.systemBlue },
};

const FALLBACK_ICON: IconSpec = { name: 'bell.fill', tint: ios.systemGray };

/** WaraApiError code → 한국어 안내. */
function messageForError(err: unknown): string {
  if (err instanceof WaraApiError && err.code === 'NOTIFICATION_NOT_FOUND') {
    return '알림을 찾을 수 없어요';
  }
  return '알림을 불러오지 못했어요';
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

/** ai_complete는 content가 JSON이라 사람이 읽는 문구로 치환. */
function displayContent(n: Notification): string {
  if (n.type === 'ai_complete') {
    try {
      const parsed = JSON.parse(n.content) as { success?: boolean };
      return parsed.success
        ? 'AI 커버 이미지가 완성됐어요!'
        : 'AI 커버 이미지 생성에 실패했어요.';
    } catch {
      return 'AI 커버 이미지 생성이 완료됐어요.';
    }
  }
  return n.content;
}

/**
 * 알림 → 앱 내 딥링크. 라우팅 불가(대화방·투표 상세 등 미구현)면 null.
 * 투표(vote_*)는 웹의 /invitations/:id/vote 대신 모바일엔 상세만 있어 상세로 보낸다.
 */
function hrefFor(n: Notification): Href | null {
  if (n.targetType === 'invitation' && n.targetId) {
    return `/invitations/${n.targetId}` as Href;
  }
  if (
    n.invitationId &&
    (n.targetType === 'feedback' || n.targetType === 'photo' || n.targetType === 'mission')
  ) {
    return `/invitations/${n.invitationId}` as Href;
  }
  // conversation(DM) 라우트는 모바일 미구현 — 라우팅하지 않음.
  return null;
}

/** unknown 소켓 페이로드 → Notification 최소 검증. */
function asNotification(raw: unknown): Notification | null {
  if (raw === null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.type !== 'string' || typeof r.content !== 'string') {
    return null;
  }
  return raw as Notification;
}

type ListCache = InfiniteData<NotificationsPage, string | undefined>;

export default function NotificationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const listQuery = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // 신규 알림 실시간 수신 → 첫 페이지 prepend(중복 제거) + 미읽음 수 재조회.
  const onNew = useCallback(
    (raw: unknown) => {
      const n = asNotification(raw);
      if (!n) return;
      qc.setQueryData<ListCache>(notificationKeys.list, (cache) => {
        if (!cache) return cache;
        const deduped = cache.pages.map((page) => ({
          ...page,
          items: page.items.filter((it) => it.id !== n.id),
        }));
        const [first, ...rest] = deduped;
        if (!first) return cache;
        return { ...cache, pages: [{ ...first, items: [n, ...first.items] }, ...rest] };
      });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
    [qc],
  );

  // 다른 세션(웹 등)에서 읽음 처리 → 캐시 동기화.
  const onRead = useCallback(
    (id: string) => {
      qc.setQueryData<ListCache>(notificationKeys.list, (cache) => {
        if (!cache) return cache;
        const readAt = new Date().toISOString();
        return {
          ...cache,
          pages: cache.pages.map((p) => ({
            ...p,
            items: p.items.map((it) => (it.id === id ? { ...it, isRead: true, readAt } : it)),
          })),
        };
      });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
    [qc],
  );

  const onReadAll = useCallback(() => {
    qc.setQueryData<{ count: number }>(notificationKeys.unread, { count: 0 });
    qc.invalidateQueries({ queryKey: notificationKeys.list });
  }, [qc]);

  useNotificationSocket({ onNew, onRead, onReadAll });

  const items = listQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const hasUnread = (unreadCount.data ?? 0) > 0;

  const onPressItem = useCallback(
    (n: Notification) => {
      if (!n.isRead) markAsRead.mutate(n.id);
      const href = hrefFor(n);
      if (href) {
        haptics.selection();
        router.push(href);
      }
    },
    [markAsRead, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationRow
        item={item}
        onPress={() => onPressItem(item)}
        onMarkRead={() => markAsRead.mutate(item.id)}
      />
    ),
    [onPressItem, markAsRead],
  );

  // 타이틀은 네이티브 헤더가 담당 — 리스트 상단에는 '모두 읽음' 액션만 노출.
  const header = hasUnread ? (
    <View style={styles.header}>
      <Pressable
        onPress={() => {
          haptics.selection();
          markAllAsRead.mutate();
        }}
        hitSlop={8}>
        <Text style={styles.markAll}>모두 읽음</Text>
      </Pressable>
    </View>
  ) : null;

  // 초기 로딩
  if (listQuery.isPending) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  // 에러
  if (listQuery.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{messageForError(listQuery.error)}</Text>
          <Pressable onPress={() => listQuery.refetch()} hitSlop={8}>
            <Text style={styles.markAll}>다시 시도</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentInsetAdjustmentBehavior="automatic"
        ItemSeparatorComponent={Separator}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.center}>
            <IconSymbol name="bell.slash" size={40} color={ios.tertiaryLabel} />
            <Text style={styles.emptyBody}>새로운 알림이 없어요</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching}
            onRefresh={() => listQuery.refetch()}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
            listQuery.fetchNextPage();
          }
        }}
        ListFooterComponent={
          listQuery.isFetchingNextPage ? (
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

function NotificationRow({
  item,
  onPress,
  onMarkRead,
}: {
  item: Notification;
  onPress: () => void;
  onMarkRead: () => void;
}) {
  const icon = TYPE_ICON[item.type] ?? FALLBACK_ICON;

  const body = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !item.isRead && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: icon.tint }]}>
        <IconSymbol name={icon.name} size={17} color="#FFFFFF" />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowContent} numberOfLines={2}>
          {displayContent(item)}
        </Text>
        <Text style={styles.rowTime}>{relativeTime(item.createdAt)}</Text>
      </View>
      {!item.isRead ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );

  if (item.isRead) return body;

  return (
    <SwipeableRow rightActions={[{ label: '읽음', onPress: onMarkRead }]}>{body}</SwipeableRow>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ios.systemBackground },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: iosMetrics.pagePadding,
    paddingVertical: iosMetrics.spacing[2],
  },
  markAll: { ...iosType.body, color: ios.tint },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[16],
  },
  emptyContainer: { flexGrow: 1 },
  emptyTitle: { ...iosType.headline, color: ios.label },
  emptyBody: { ...iosType.subhead, color: ios.secondaryLabel },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.pagePadding,
    paddingVertical: iosMetrics.spacing[3],
    minHeight: iosMetrics.rowMinHeight,
    backgroundColor: ios.systemBackground,
  },
  rowUnread: { backgroundColor: ios.secondarySystemBackground },
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
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: ios.systemBlue,
  },
  separator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: iosMetrics.pagePadding + 32 + iosMetrics.spacing[3],
  },
  footer: { paddingVertical: iosMetrics.spacing[4] },
});
