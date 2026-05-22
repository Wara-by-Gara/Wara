import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { getAccessToken, invitationKeys } from '@/api';
import { DevTokenForm } from '@/components/dev-token-form';
import { InvitationsList } from '@/components/invitations-list';
import { ThemedView } from '@/components/themed-view';

// auth 상태 query — useState 대신 useQuery로 두면 mutation 후 invalidate로 갱신 자연스러움.
// (auth-kakao PR에서 본격 auth context로 대체될 자리)
const AUTH_KEY = ['auth', 'access-token'] as const;

export default function HomeScreen() {
  const queryClient = useQueryClient();
  // staleTime을 길게 두지 않음 — 401 글로벌 핸들러(clearTokens) 후 화면 재마운트/포커스 시
  // 토큰 없음을 즉시 감지해서 DevTokenForm으로 전환되도록.
  const authQuery = useQuery({
    queryKey: AUTH_KEY,
    queryFn: getAccessToken,
    staleTime: 5_000,
  });

  if (authQuery.isPending) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const hasToken = !!authQuery.data;

  if (!hasToken) {
    return (
      <DevTokenForm
        onIssued={() => {
          queryClient.invalidateQueries({ queryKey: AUTH_KEY });
          queryClient.invalidateQueries({ queryKey: invitationKeys.all });
        }}
      />
    );
  }

  return (
    <InvitationsList
      onLogout={() => queryClient.invalidateQueries({ queryKey: AUTH_KEY })}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
