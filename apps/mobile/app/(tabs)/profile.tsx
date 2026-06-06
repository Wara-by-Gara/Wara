import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { login as kakaoLogin } from '@react-native-kakao/user';
import NaverLogin from '@react-native-seoul/naver-login';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import {
  clearAllSocialSessions,
  clearTokens,
  deleteMe,
  deleteMySocial,
  describeLoginError,
  ensureKakaoSDK,
  fetchMe,
  fetchMySocials,
  isKakaoCancellation,
  linkSocialWithToken,
  logout,
  mergeAccounts,
  type MySocial,
  userKeys,
  WaraApiError,
} from '@/api';
import { colors, layout, radius, spacing, typography } from '@/constants/tokens';

type Provider = 'kakao' | 'naver' | 'google';

const PROVIDER_LABEL: Record<Provider, string> = {
  kakao: '카카오',
  naver: '네이버',
  google: 'Google',
};

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const [linking, setLinking] = useState<Provider | null>(null);

  const { data: me } = useQuery({
    queryKey: userKeys.me(),
    queryFn: ({ signal }) => fetchMe(signal),
  });

  const { data: socials } = useQuery({
    queryKey: userKeys.socials(),
    queryFn: ({ signal }) => fetchMySocials(signal),
  });

  const connectedProviders = new Set(socials?.map((s) => s.provider) ?? []);

  const { mutate: doDeleteSocial, isPending: isDisconnecting } = useMutation({
    mutationFn: (provider: MySocial['provider']) => deleteMySocial(provider),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.socials() }),
  });

  const { mutate: doMerge } = useMutation({
    mutationFn: (mergeToken: string) => mergeAccounts(mergeToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.socials() });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });

  async function fullLogout() {
    try {
      await logout();
    } catch {
      // 서버 호출 실패해도 로컬 세션은 정리
    }
    await clearAllSocialSessions();
    await clearTokens();
    queryClient.clear();
    router.replace('/login');
  }

  function handleLogout() {
    Alert.alert('로그아웃 할까요?', '다시 들어오려면 다시 로그인해야 해요.', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: fullLogout },
    ]);
  }

  function handleWithdraw() {
    Alert.alert(
      '회원 탈퇴',
      '탈퇴하면 모든 데이터가 즉시 삭제되고 복구할 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: () => {
            deleteMe({})
              .then(async () => {
                await clearAllSocialSessions();
                await clearTokens();
                queryClient.clear();
                router.replace('/login');
              })
              .catch((err) => Alert.alert('탈퇴 실패', describeLoginError(err)));
          },
        },
      ],
    );
  }

  function handleDisconnect(provider: Provider) {
    if (connectedProviders.size <= 1) {
      Alert.alert('해제 불가', '다른 소셜을 먼저 연결한 뒤 해제할 수 있어요.');
      return;
    }
    Alert.alert(
      `${PROVIDER_LABEL[provider]} 연결 해제`,
      '다음 로그인부터 이 계정을 사용할 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          style: 'destructive',
          onPress: () => doDeleteSocial(provider),
        },
      ],
    );
  }

  async function getProviderToken(provider: Provider): Promise<string | null> {
    if (provider === 'kakao') {
      await ensureKakaoSDK();
      const result = await kakaoLogin();
      return result.accessToken;
    }
    if (provider === 'naver') {
      const { isSuccess, successResponse } = await NaverLogin.login();
      if (!isSuccess || !successResponse) return null;
      return successResponse.accessToken;
    }
    if (provider === 'google') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type !== 'success' || !response.data.idToken) return null;
      return response.data.idToken;
    }
    return null;
  }

  function promptMerge(provider: Provider, mergeToken: string) {
    Alert.alert(
      `${PROVIDER_LABEL[provider]} 계정과 합칠까요?`,
      '이 소셜로 가입한 다른 wara 계정의 모든 데이터(초대장, 사진 등)가 현재 계정으로 이전돼요. 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '합치기',
          style: 'destructive',
          onPress: () =>
            doMerge(mergeToken, {
              onSuccess: () =>
                Alert.alert('완료', `${PROVIDER_LABEL[provider]} 계정이 합쳐졌어요.`),
              onError: (err) =>
                Alert.alert('합치기 실패', describeLoginError(err)),
            }),
        },
      ],
    );
  }

  async function handleLink(provider: Provider) {
    setLinking(provider);
    try {
      const token = await getProviderToken(provider);
      if (!token) {
        setLinking(null);
        return;
      }
      await linkSocialWithToken(provider, token);
      queryClient.invalidateQueries({ queryKey: userKeys.socials() });
      Alert.alert('연결 완료', `${PROVIDER_LABEL[provider]} 계정이 연결됐어요.`);
    } catch (err) {
      if (isKakaoCancellation(err)) {
        // 사용자가 취소 — 무시
      } else if (
        err instanceof WaraApiError &&
        err.code === 'SOCIAL_ALREADY_LINKED'
      ) {
        const mergeToken = (err.details as { mergeToken?: string } | undefined)
          ?.mergeToken;
        if (mergeToken) {
          promptMerge(provider, mergeToken);
        } else {
          Alert.alert('연결 실패', describeLoginError(err));
        }
      } else {
        Alert.alert('연결 실패', describeLoginError(err));
      }
    } finally {
      setLinking(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>마이페이지</Text>

        <View style={styles.section}>
          <Text style={styles.label}>이름</Text>
          <Text style={styles.value}>{me?.name ?? me?.nickname ?? '—'}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>이메일</Text>
          <Text style={styles.value}>{me?.email ?? '—'}</Text>
        </View>

        <Text style={styles.sectionTitle}>연결된 소셜 계정</Text>
        {(['kakao', 'naver', 'google'] as const).map((provider) => {
          const isConnected = connectedProviders.has(provider);
          const isThisLinking = linking === provider;
          const onPress = isConnected
            ? () => handleDisconnect(provider)
            : () => handleLink(provider);
          return (
            <Pressable
              key={provider}
              style={styles.row}
              onPress={onPress}
              disabled={isThisLinking || isDisconnecting}
            >
              <Text style={styles.rowLabel}>{PROVIDER_LABEL[provider]}</Text>
              <Text style={styles.rowAction}>
                {isThisLinking ? '연결 중...' : isConnected ? '연결됨' : '연결하기'}
              </Text>
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>계정</Text>
        <Pressable style={styles.row} onPress={handleLogout}>
          <Text style={[styles.rowLabel, styles.dangerText]}>로그아웃</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={handleWithdraw}>
          <Text style={[styles.rowLabel, styles.dangerText]}>회원 탈퇴</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: layout.pagePadding, gap: spacing[3] },
  title: { ...typography.heading1, color: colors.textPrimary, marginBottom: spacing[2] },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  label: { ...typography.body2, color: colors.textSecondary },
  value: { ...typography.body2, color: colors.textPrimary },
  sectionTitle: {
    ...typography.caption2,
    color: colors.textTertiary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  rowLabel: { ...typography.body1, color: colors.textPrimary },
  rowAction: { ...typography.caption1, color: colors.textTertiary },
  dangerText: { color: colors.danger },
});
