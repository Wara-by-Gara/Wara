import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { fetchInvitation, invitationKeys, WaraApiError } from '@/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { colors } from '@/constants/tokens';

/**
 * 초대장 상세. Expo Router dynamic route — /invitations/:id.
 * useLocalSearchParams로 id 추출, useQuery로 GET /invitations/:id.
 *
 * 와라 API 명세상 상세는 비로그인 접근 가능 (RSVP는 별도) → apiFetch authenticated:false 유지.
 */
export default function InvitationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({
    queryKey: invitationKeys.detail(id),
    queryFn: ({ signal }) => fetchInvitation(id, { signal }),
    enabled: !!id,
  });

  if (query.isPending) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: '초대장' }} />
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (query.error) {
    const err = query.error;
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: '오류' }} />
        <ThemedText type="subtitle">불러오기 실패</ThemedText>
        <ThemedText style={styles.errorBody}>
          {err instanceof WaraApiError
            ? `${err.code} — ${err.message}`
            : '네트워크 오류 — 서버가 켜져 있나요?'}
        </ThemedText>
      </ThemedView>
    );
  }

  const inv = query.data;
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: inv.title }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title">{inv.title}</ThemedText>
        <View style={styles.metaRow}>
          <Badge label={inv.status === 'closed' ? '마감됨' : '진행 중'} />
          {inv.isMissionEnabled && <Badge label="미션" />}
        </View>
        {inv.eventStartAt && (
          <ThemedText style={styles.meta}>
            일시 · {formatDateTime(inv.eventStartAt)}
          </ThemedText>
        )}
        <ThemedText style={styles.description}>{inv.description}</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <ThemedText style={styles.badgeText}>{label}</ThemedText>
    </View>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
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
  scroll: { padding: 20, gap: 12 },
  metaRow: { flexDirection: 'row', gap: 8 },
  meta: { fontSize: 14, opacity: 0.7 },
  description: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  badgeText: { fontSize: 12 },
  errorBody: { fontSize: 13, opacity: 0.7, textAlign: 'center' },
});
