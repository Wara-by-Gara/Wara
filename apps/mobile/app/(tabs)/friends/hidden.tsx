// 삭제한 친구 목록 — 웹 /friends/hidden 미러.
// 아바타·이름 행, 스와이프 '되돌리기'로 친구 복원.
// 앱 크롬이므로 색상/메트릭은 theme 토큰과 components/ios 킷만 사용.

import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { Button, ListSection, Screen, SwipeableRow } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError } from '@/api';
import type { HiddenFriend } from '@/api/friends';
import { useHiddenFriends, useRestoreFriend } from '@/hooks/queries/friends';

const AVATAR_SIZE = 40;

/** WaraApiError code → 한국어 안내. */
function messageForError(err: unknown): string {
  if (err instanceof WaraApiError && err.code === 'FRIEND_NOT_FOUND') {
    return '친구를 찾을 수 없어요';
  }
  return '문제가 발생했어요';
}

export default function HiddenFriendsScreen() {
  const hiddenQuery = useHiddenFriends();
  const restoreFriend = useRestoreFriend();

  if (hiddenQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (hiddenQuery.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(hiddenQuery.error)}</Text>
        <Button title="다시 시도" onPress={() => hiddenQuery.refetch()} />
      </View>
    );
  }

  const friends = hiddenQuery.data?.friends ?? [];

  return (
    <Screen
      background="grouped"
      scroll
      refreshControl={
        <RefreshControl
          refreshing={hiddenQuery.isRefetching}
          onRefresh={() => hiddenQuery.refetch()}
        />
      }>
      {friends.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>삭제한 친구가 없어요</Text>
          <Text style={styles.emptySub}>친구를 삭제하면 여기서 되돌릴 수 있어요</Text>
        </View>
      ) : (
        <ListSection footer="스와이프해서 친구를 되돌릴 수 있어요.">
          {friends.map((friend) => (
            <HiddenFriendRow
              key={friend.id}
              friend={friend}
              onRestore={() => restoreFriend.mutate(friend.id)}
            />
          ))}
        </ListSection>
      )}
    </Screen>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────────

function Avatar({ url }: { url: string | null }) {
  if (url) {
    return (
      <Image source={{ uri: url }} style={styles.avatar} contentFit="cover" transition={150} />
    );
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <IconSymbol name="person.fill" size={20} color={ios.systemGray} />
    </View>
  );
}

function HiddenFriendRow({
  friend,
  onRestore,
  isLast = false,
}: {
  friend: HiddenFriend;
  onRestore: () => void;
  isLast?: boolean;
}) {
  return (
    <View>
      <SwipeableRow rightActions={[{ label: '되돌리기', onPress: onRestore }]}>
        <View style={styles.row}>
          <Avatar url={friend.avatarUrl} />
          <Text style={styles.name} numberOfLines={1}>
            {friend.name ?? '이름 없음'}
          </Text>
        </View>
      </SwipeableRow>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemGroupedBackground,
  },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: iosMetrics.spacing[16], gap: iosMetrics.spacing[2] },
  emptyText: { ...iosType.subhead, color: ios.secondaryLabel },
  emptySub: { ...iosType.footnote, color: ios.tertiaryLabel },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    minHeight: iosMetrics.rowMinHeight,
    paddingVertical: iosMetrics.spacing[2],
    paddingHorizontal: iosMetrics.spacing[4],
    backgroundColor: ios.secondarySystemGroupedBackground,
  },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: iosMetrics.radius.full },
  avatarFallback: {
    backgroundColor: ios.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...iosType.body, color: ios.label, flex: 1 },
  separator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: AVATAR_SIZE + iosMetrics.spacing[3] + iosMetrics.spacing[4],
  },
});
