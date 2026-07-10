// DM 대화 목록 — 마지막 메시지·미읽음·시간. 탭 시 /chat/[conversationId].
// 앱 크롬이므로 색상/메트릭은 theme 토큰 + components/ios 킷만 사용.

import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError } from '@/api';
import type { ConversationListItem } from '@/api/conversations';
import { useConversations } from '@/hooks/queries/conversations';

const AVATAR_SIZE = 52;

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

function messageForError(err: unknown): string {
  if (err instanceof WaraApiError) return '대화를 불러오지 못했어요';
  return '문제가 발생했어요';
}

export default function ChatListScreen() {
  const router = useRouter();
  const query = useConversations();

  if (query.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (query.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(query.error)}</Text>
        <Button title="다시 시도" onPress={() => query.refetch()} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentInsetAdjustmentBehavior="automatic"
      data={query.data}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 대화가 없어요</Text>
        </View>
      }
      renderItem={({ item }) => (
        <ConversationRow item={item} onPress={() => router.push(`/chat/${item.id}`)} />
      )}
    />
  );
}

function ConversationRow({
  item,
  onPress,
}: {
  item: ConversationListItem;
  onPress: () => void;
}) {
  const avatarUrl = item.type === 'direct' ? (item.partner?.avatarUrl ?? item.avatarUrl) : item.avatarUrl;
  const title = item.title || item.partner?.name || '이름 없음';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <IconSymbol
            name={item.type === 'group' ? 'person.2.fill' : 'person.fill'}
            size={22}
            color={ios.systemGray}
          />
        </View>
      )}

      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {item.type === 'group' && item.memberCount > 0 ? (
            <Text style={styles.count}>{item.memberCount}</Text>
          ) : null}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {item.lastMessageText ?? '메시지 없음'}
        </Text>
      </View>

      <View style={styles.metaWrap}>
        <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
        {item.unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: ios.systemBackground },
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
  empty: { alignItems: 'center', paddingVertical: iosMetrics.spacing[16] },
  emptyText: { ...iosType.subhead, color: ios.secondaryLabel },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.pagePadding,
    paddingVertical: iosMetrics.spacing[2],
    minHeight: 72,
  },
  rowPressed: { backgroundColor: ios.systemFill },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarFallback: {
    backgroundColor: ios.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[2] },
  title: { ...iosType.headline, color: ios.label, flexShrink: 1 },
  count: { ...iosType.footnote, color: ios.secondaryLabel },
  preview: { ...iosType.subhead, color: ios.secondaryLabel },
  metaWrap: { alignItems: 'flex-end', gap: iosMetrics.spacing[1] },
  time: { ...iosType.footnote, color: ios.tertiaryLabel },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: ios.systemRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...iosType.caption2, color: '#FFFFFF', fontWeight: '600' },
});
