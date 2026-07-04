// 친구 목록 화면 — 같은 모임 참여로 자동 추가된 친구.
// 친구/숨김 세그먼트, 아바타·이름·함께한 모임, 탭→프로필, 스와이프 삭제/재추가.
// 앱 크롬이므로 색상/메트릭은 theme 토큰과 components/ios 킷만 사용.

import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';

import {
  Button,
  ListSection,
  Screen,
  SegmentedControl,
  SwipeableRow,
} from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError } from '@/api';
import type { Friend, HiddenFriend } from '@/api/friends';
import {
  useFriends,
  useHiddenFriends,
  useHideFriend,
  useRestoreFriend,
} from '@/hooks/queries/friends';
import { useCreateConversation } from '@/hooks/queries/conversations';

const AVATAR_SIZE = 40;

/** WaraApiError code → 한국어 안내. */
function messageForError(err: unknown): string {
  if (err instanceof WaraApiError && err.code === 'FRIEND_NOT_FOUND') {
    return '친구를 찾을 수 없어요';
  }
  return '문제가 발생했어요';
}

export default function FriendsScreen() {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  const friendsQuery = useFriends();
  const hiddenQuery = useHiddenFriends();
  const hideFriend = useHideFriend();
  const restoreFriend = useRestoreFriend();
  const createConversation = useCreateConversation();

  const isHiddenTab = tabIndex === 1;
  const activeQuery = isHiddenTab ? hiddenQuery : friendsQuery;

  /** 친구와 1:1 DM 시작 → 대화방으로 이동. */
  function startDm(userId: string) {
    createConversation.mutate(userId, {
      onSuccess: (conv) => router.push(`/chat/${conv.id}`),
    });
  }

  const screenHeader = <Stack.Screen options={{ title: '친구', headerLargeTitle: true }} />;

  if (activeQuery.isPending) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (activeQuery.error) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(activeQuery.error)}</Text>
        <Button title="다시 시도" onPress={() => activeQuery.refetch()} />
      </View>
    );
  }

  const friends = friendsQuery.data?.friends ?? [];
  const hidden = hiddenQuery.data?.friends ?? [];
  const visible = isHiddenTab ? hidden : friends;

  return (
    <>
      {screenHeader}
      <Screen
        background="grouped"
        scroll
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isRefetching}
            onRefresh={() => activeQuery.refetch()}
          />
        }>
        <View style={styles.segmentWrap}>
          <SegmentedControl
            values={[`친구 ${friends.length}`, `숨김 ${hidden.length}`]}
            selectedIndex={tabIndex}
            onChange={setTabIndex}
          />
        </View>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isHiddenTab ? '숨긴 친구가 없어요' : '아직 친구가 없어요'}
            </Text>
            {!isHiddenTab ? (
              <Text style={styles.emptySub}>같은 모임에 참여하면 자동으로 추가돼요</Text>
            ) : null}
          </View>
        ) : (
          <ListSection>
            {visible.map((item) =>
              isHiddenTab ? (
                <HiddenRow
                  key={item.id}
                  friend={item as HiddenFriend}
                  onRestore={() => restoreFriend.mutate(item.id)}
                />
              ) : (
                <FriendRow
                  key={item.id}
                  friend={item as Friend}
                  onHide={() => hideFriend.mutate(item.id)}
                  onMessage={() => startDm(item.id)}
                />
              ),
            )}
          </ListSection>
        )}
      </Screen>
    </>
  );
}

// ── Rows ─────────────────────────────────────────────────────────────────────

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

function FriendRow({
  friend,
  onHide,
  onMessage,
  isLast = false,
}: {
  friend: Friend;
  onHide: () => void;
  onMessage: () => void;
  isLast?: boolean;
}) {
  const router = useRouter();
  const name = friend.name ?? '이름 없음';
  const subtitle =
    friend.sharedCount > 0
      ? `함께한 모임 ${friend.sharedCount}개 · ${friend.lastSharedTitle}`
      : friend.lastSharedTitle;

  return (
    <View>
      <SwipeableRow
        rightActions={[
          { label: '메시지', onPress: onMessage },
          { label: '삭제', destructive: true, onPress: onHide },
        ]}>
        <RowContent
          avatar={<Avatar url={friend.avatarUrl} />}
          name={name}
          subtitle={subtitle}
          onPress={() => router.push(`/friends/${friend.id}`)}
        />
      </SwipeableRow>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}

function HiddenRow({
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
      <SwipeableRow rightActions={[{ label: '재추가', onPress: onRestore }]}>
        <RowContent
          avatar={<Avatar url={friend.avatarUrl} />}
          name={friend.name ?? '이름 없음'}
          subtitle="숨긴 친구"
        />
      </SwipeableRow>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}

function RowContent({
  avatar,
  name,
  subtitle,
  onPress,
}: {
  avatar: ReactNode;
  name: string;
  subtitle: string;
  onPress?: () => void;
}) {
  const inner = (
    <View style={styles.row}>
      {avatar}
      <View style={styles.textWrap}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {onPress ? (
        <IconSymbol name="chevron.right" size={14} color={ios.tertiaryLabel} weight="semibold" />
      ) : null}
    </View>
  );

  if (!onPress) return inner;
  return (
    <View>
      <Pressable onPress={onPress}>{inner}</Pressable>
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
  segmentWrap: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingTop: iosMetrics.spacing[3],
  },
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
  textWrap: { flex: 1, gap: 2 },
  name: { ...iosType.body, color: ios.label },
  subtitle: { ...iosType.footnote, color: ios.secondaryLabel },
  separator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: AVATAR_SIZE + iosMetrics.spacing[3] + iosMetrics.spacing[4],
  },
});
