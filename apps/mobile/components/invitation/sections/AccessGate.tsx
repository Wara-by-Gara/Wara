/**
 * 초대장 입장 비밀번호 게이트 — 웹 InvitationDetail/AccessGate 미러.
 * hasPassword && 참가자 아님 && 미통과일 때 상세 대신 렌더. 통과 상태는 메모리(세션 한정) 저장.
 * 시도제한(서버 Throttle 5회/60초) 초과 시 rate_limit 에러를 쿨다운 안내로 분기.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { WaraApiError, verifyInvitationAccess } from '@/api';
import { Button, haptics } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';

type Props = {
  invitationId: string;
  onUnlocked: () => void;
};

// 통과한 초대장 id — 앱 프로세스 생존 동안만 유지 (웹 sessionStorage 미러).
const unlockedInvitations = new Set<string>();

/** 이 세션에서 이미 비밀번호를 통과했는지. 상세 화면의 게이트 분기에 사용. */
export function isInvitationUnlocked(invitationId: string): boolean {
  return unlockedInvitations.has(invitationId);
}

function messageForError(error: unknown): string {
  if (error instanceof WaraApiError) {
    if (error.type === 'rate_limit' || error.status === 429) {
      return '시도가 너무 많아요. 잠시 후 다시 시도해주세요';
    }
    switch (error.code) {
      case 'INVITATION_NOT_FOUND':
        return '초대장을 찾을 수 없어요';
      case 'INVITATION_ACCESS_REVOKED':
        return '이 초대장에 접근할 수 없어요';
    }
    return '문제가 발생했어요';
  }
  return '네트워크 오류 — 잠시 후 다시 시도해주세요';
}

export function AccessGate({ invitationId, onUnlocked }: Props) {
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const verify = useMutation({
    mutationFn: (value: string) => verifyInvitationAccess(invitationId, value),
    onSuccess: ({ valid }) => {
      if (valid) {
        unlockedInvitations.add(invitationId);
        haptics.success();
        onUnlocked();
      } else {
        haptics.error();
        setErrorText('비밀번호가 일치하지 않아요');
      }
    },
    onError: (error) => {
      haptics.error();
      setErrorText(messageForError(error));
    },
  });

  const submit = () => {
    if (!password.trim() || verify.isPending) return;
    setErrorText(null);
    verify.mutate(password);
  };

  return (
    <View style={styles.container}>
      <IconSymbol name="lock.fill" size={44} color={ios.secondaryLabel} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>비밀번호가 필요해요</Text>
        <Text style={styles.body}>호스트가 설정한 입장 비밀번호를 입력해주세요</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={[styles.input, errorText ? styles.inputInvalid : null]}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (errorText) setErrorText(null);
          }}
          onSubmitEditing={submit}
          placeholder="비밀번호"
          placeholderTextColor={ios.placeholderText}
          secureTextEntry
          maxLength={50}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="done"
          accessibilityLabel="입장 비밀번호"
        />
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        <Button
          title="입장하기"
          onPress={submit}
          loading={verify.isPending}
          disabled={!password.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[4],
    paddingHorizontal: iosMetrics.pagePadding,
    backgroundColor: ios.systemBackground,
  },
  textBlock: { alignItems: 'center', gap: iosMetrics.spacing[1] },
  title: { ...iosType.headline, color: ios.label },
  body: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },
  form: { alignSelf: 'stretch', gap: iosMetrics.spacing[2] },
  input: {
    ...iosType.body,
    color: ios.label,
    minHeight: 44,
    borderRadius: iosMetrics.radius.md,
    backgroundColor: ios.tertiarySystemFill,
    paddingHorizontal: iosMetrics.spacing[3],
    textAlign: 'center',
  },
  inputInvalid: {
    borderWidth: 1,
    borderColor: ios.systemRed,
  },
  errorText: { ...iosType.footnote, color: ios.systemRed, textAlign: 'center' },
});
