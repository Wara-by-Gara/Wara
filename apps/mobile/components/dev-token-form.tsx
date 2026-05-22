import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { issueDevToken, setTokens, type DevUserEmail, DEV_USER_EMAILS, WaraApiError } from '@/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * 개발 전용 토큰 발급 UI. auth-kakao PR 머지 후 로그인 화면으로 대체.
 * 시드 유저 이메일 선택 → BE /auth/dev/token 호출 → SecureStore 저장.
 */
export function DevTokenForm({ onIssued }: { onIssued: () => void }) {
  const [selected, setSelected] = useState<DevUserEmail>('host1@wara.dev');

  const mutation = useMutation<void, Error, DevUserEmail>({
    mutationFn: async (email) => {
      const { accessToken } = await issueDevToken(email);
      await setTokens({ accessToken });
    },
    onSuccess: onIssued,
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">와라</ThemedText>
      <ThemedText style={styles.subtitle}>개발용 — 시드 유저 선택</ThemedText>

      <View style={styles.list}>
        {DEV_USER_EMAILS.map((email) => (
          <Pressable
            key={email}
            onPress={() => setSelected(email)}
            style={[styles.row, selected === email && styles.rowActive]}>
            <ThemedText>{email}</ThemedText>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.button, mutation.isPending && styles.buttonDisabled]}
        disabled={mutation.isPending}
        onPress={() => mutation.mutate(selected)}>
        <ThemedText style={styles.buttonText}>
          {mutation.isPending ? '발급 중…' : '토큰 발급'}
        </ThemedText>
      </Pressable>

      {mutation.error && (
        <ThemedText style={styles.error}>
          {mutation.error instanceof WaraApiError
            ? `${mutation.error.code} — ${mutation.error.message}`
            : '네트워크 오류 — 서버가 켜져 있나요?'}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  subtitle: {
    opacity: 0.6,
  },
  list: {
    gap: 6,
    marginVertical: 8,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  rowActive: {
    backgroundColor: 'rgba(10,126,164,0.15)',
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#c33',
    fontSize: 13,
  },
});
