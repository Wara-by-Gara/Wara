// 친구 프로필 화면 — 기본 정보, 함께한 친구(mutual), 함께한 모임 목록.
// 앱 크롬이므로 색상/메트릭은 theme 토큰과 components/ios 킷만 사용.

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Button, ListSection, ListRow, Screen } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError } from '@/api';
import { useFriendProfile } from '@/hooks/queries/friends';
import { useCreateConversation } from '@/hooks/queries/conversations';

const AVATAR_SIZE = 88;

function messageForError(err: unknown): string {
  if (err instanceof WaraApiError && err.code === 'FRIEND_NOT_FOUND') {
    return '친구를 찾을 수 없어요';
  }
  return '문제가 발생했어요';
}

/** ISO → "2026년 7월 1일". */
function formatDate(iso: string | null): string {
  if (!iso) return '일정 미정';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function FriendProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const query = useFriendProfile(userId);
  const createConversation = useCreateConversation();

  if (query.isPending) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (query.error) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(query.error)}</Text>
        <Button title="다시 시도" onPress={() => query.refetch()} />
      </View>
    );
  }

  const profile = query.data;
  const name = profile.name ?? '이름 없음';

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <Screen background="grouped" scroll>
        <View style={styles.hero}>
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <IconSymbol name="person.fill" size={40} color={ios.systemGray} />
            </View>
          )}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.shared}>함께한 모임 {profile.sharedCount}개</Text>
          <View style={styles.dmWrap}>
            <Button
              title="메시지 보내기"
              variant="tinted"
              loading={createConversation.isPending}
              onPress={() =>
                createConversation.mutate(profile.id, {
                  onSuccess: (conv) => router.push(`/chat/${conv.id}`),
                })
              }
            />
          </View>
        </View>

        {profile.mutualFriends.length > 0 ? (
          <ListSection header="함께 아는 친구">
            {profile.mutualFriends.map((mf) => (
              <ListRow
                key={mf.id}
                title={mf.name ?? '이름 없음'}
                accessory="chevron"
                onPress={() => router.push(`/friends/${mf.id}`)}
              />
            ))}
          </ListSection>
        ) : null}

        {profile.sharedInvitations.length > 0 ? (
          <ListSection header="함께한 모임">
            {profile.sharedInvitations.map((inv) => (
              <ListRow
                key={inv.id}
                title={inv.title}
                subtitle={`${formatDate(inv.eventStartAt)}${
                  inv.location ? ` · ${inv.location}` : ''
                }`}
                value={inv.isHostedByMe ? '내 모임' : undefined}
                accessory="chevron"
                onPress={() => router.push(`/invitations/${inv.id}`)}
              />
            ))}
          </ListSection>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>함께한 모임이 없어요</Text>
          </View>
        )}
      </Screen>
    </>
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
  hero: {
    alignItems: 'center',
    gap: iosMetrics.spacing[2],
    paddingTop: iosMetrics.spacing[6],
    paddingBottom: iosMetrics.spacing[2],
  },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: iosMetrics.radius.full },
  avatarFallback: {
    backgroundColor: ios.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...iosType.title2, fontWeight: '600', color: ios.label },
  shared: { ...iosType.subhead, color: ios.secondaryLabel },
  dmWrap: { marginTop: iosMetrics.spacing[3], alignSelf: 'stretch', paddingHorizontal: iosMetrics.pagePadding },
  empty: { alignItems: 'center', paddingVertical: iosMetrics.spacing[16] },
  emptyText: { ...iosType.subhead, color: ios.secondaryLabel },
});
