import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  clearAllSocialSessions,
  clearTokens,
  fetchMyInvitations,
  invitationKeys,
  WaraApiError,
  type Invitation,
} from '@/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { colors, shadow } from '@/constants/tokens';

/**
 * 본인 host 초대장 목록.
 * - useQuery로 GET /invitations 호출, AbortSignal 자동 전달
 * - 로딩/에러/빈 상태 명시
 * - 카드 탭 → /invitations/[id] 상세로 이동 (Expo Router Link)
 */
export function InvitationsList({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const query = useQuery({
    queryKey: invitationKeys.myList,
    queryFn: ({ signal }) => fetchMyInvitations({ signal }),
  });

  if (query.isPending) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (query.error) {
    const err = query.error;
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="subtitle">불러오기 실패</ThemedText>
        <ThemedText style={styles.errorBody}>
          {err instanceof WaraApiError
            ? `${err.code} — ${err.message}`
            : '네트워크 오류 — 서버가 켜져 있나요?'}
        </ThemedText>
        <View style={styles.actions}>
          <Pressable style={styles.buttonSecondary} onPress={() => query.refetch()}>
            <ThemedText>다시 시도</ThemedText>
          </Pressable>
          <Pressable
            style={styles.buttonGhost}
            onPress={async () => {
              await clearAllSocialSessions();
              await clearTokens();
              await queryClient.invalidateQueries({ queryKey: invitationKeys.all });
              onLogout();
            }}>
            <ThemedText>로그아웃</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <ThemedText type="title">내 초대장</ThemedText>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/photos/map')}>
            <ThemedText style={styles.mapLink}>사진 지도</ThemedText>
          </Pressable>
          <Pressable
            onPress={async () => {
              await clearAllSocialSessions();
              await clearTokens();
              await queryClient.invalidateQueries({ queryKey: invitationKeys.all });
              onLogout();
            }}>
            <ThemedText style={styles.logout}>로그아웃</ThemedText>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={query.data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>
            host인 초대장이 없어요. 다른 시드 유저로 로그인해 보세요.
          </ThemedText>
        }
        renderItem={({ item }) => <InvitationCard invitation={item} />}
      />
    </ThemedView>
  );
}

function InvitationCard({ invitation }: { invitation: Invitation }) {
  return (
    <Link href={{ pathname: '/invitations/[id]', params: { id: invitation.id } }} asChild>
      <Pressable style={styles.card}>
        <ThemedText type="defaultSemiBold">{invitation.title}</ThemedText>
        <ThemedText style={styles.cardMeta}>
          {invitation.status === 'closed' ? '마감됨' : '진행 중'}
          {invitation.eventStartAt ? ` · ${formatDate(invitation.eventStartAt)}` : ''}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mapLink: {
    fontSize: 14,
    color: colors.primary,
  },
  logout: {
    fontSize: 14,
    opacity: 0.6,
  },
  listContent: { padding: 16, paddingTop: 0, paddingBottom: 32 },
  separator: { height: 12 },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 6,
    ...shadow.xs,
  },
  cardMeta: { fontSize: 13, opacity: 0.6 },
  empty: { textAlign: 'center', marginTop: 48, opacity: 0.6 },
  errorBody: { fontSize: 13, opacity: 0.7, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  buttonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  buttonGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundSoft,
  },
});
