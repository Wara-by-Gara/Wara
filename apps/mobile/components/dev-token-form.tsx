import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { DEV_USER_EMAILS, issueDevToken } from '@/api/dev-auth';
import type { DevUserEmail } from '@/api/dev-auth';
import { setTokens } from '@/api/auth-storage';
import { AUTH_QUERY_KEY } from '@/hooks/useAuthGuard';
import { colors, spacing, typography, radius } from '@/constants/tokens';

interface DevTokenFormProps {
  onIssued: () => void;
}

export function DevTokenForm({ onIssued }: DevTokenFormProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<DevUserEmail | null>(null);
  const [error, setError] = useState('');

  async function handlePress(email: DevUserEmail) {
    setLoading(email);
    setError('');
    try {
      const { accessToken } = await issueDevToken(email);
      await setTokens({ accessToken });
      // 가드 쿼리 캐시 즉시 갱신 — 안 하면 (tabs) 진입 시 캐시된 null로 /login으로 튕김
      queryClient.setQueryData(AUTH_QUERY_KEY, accessToken);
      onIssued();
    } catch {
      setError('토큰 발급 실패 — API 서버가 실행 중인지 확인하세요');
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DEV 로그인</Text>
      <Text style={styles.subtitle}>시드 유저 선택 후 토큰 발급</Text>

      {DEV_USER_EMAILS.map((email) => (
        <TouchableOpacity
          key={email}
          style={[styles.button, loading === email && styles.buttonDisabled]}
          onPress={() => handlePress(email)}
          disabled={loading !== null}
          activeOpacity={0.7}
        >
          {loading === email ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.buttonText}>{email}</Text>
          )}
        </TouchableOpacity>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
    backgroundColor: colors.backgroundSoft,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.body2,
    color: colors.textTertiary,
    marginBottom: spacing[6],
  },
  button: {
    width: '100%',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing[2],
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.body1,
    color: colors.textInverse,
  },
  error: {
    ...typography.caption1,
    color: colors.danger,
    marginTop: spacing[3],
    textAlign: 'center',
  },
});
