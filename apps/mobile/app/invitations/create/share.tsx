/**
 * 초대장 생성 6단계 — 최종 요약 확인 후 생성 실행.
 * 성공 시 상세 화면으로 replace(스택에서 생성 플로우 제거). 실패 시 에러 코드 인라인 매핑.
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, ListRow, ListSection, Screen, haptics } from '@/components/ios';
import { useCreateInvitation } from '@/hooks/queries/invitations';
import { buildCreatePayload, useCreateInvitationFlow } from '@/hooks/useCreateInvitationFlow';
import { WaraApiError } from '@/api';
import { ios, iosMetrics, iosType } from '@/theme';

/** WaraApiError 코드 → 사용자 문구. */
function messageForError(error: unknown): string {
  if (error instanceof WaraApiError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return '입력값을 확인해주세요.';
      case 'IDEMPOTENCY_IN_PROGRESS':
        return '이미 처리 중이에요. 잠시 후 다시 시도해주세요.';
      case 'TERMS_AGREEMENT_REQUIRED':
        return '약관 동의가 필요해요.';
      default:
        return '문제가 발생했어요. 다시 시도해주세요.';
    }
  }
  return '문제가 발생했어요. 다시 시도해주세요.';
}

function formatDateTime(iso?: string): string {
  if (!iso) return '미정';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '미정';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ShareStep() {
  const router = useRouter();
  const [state] = useCreateInvitationFlow();
  const { mutateAsync, isPending } = useCreateInvitation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreate() {
    setErrorMessage(null);
    try {
      const created = await mutateAsync(buildCreatePayload(state));
      haptics.success();
      router.replace(`/invitations/${created.id}`);
    } catch (error) {
      haptics.error();
      setErrorMessage(messageForError(error));
    }
  }

  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.content}>
      <Text style={styles.intro}>입력한 내용을 확인하고 초대장을 만들어보세요.</Text>

      <ListSection header="기본 정보">
        <ListRow title="제목" value={state.title.trim() || '없음'} accessory="none" />
        <ListRow title="일시" value={formatDateTime(state.eventStartAt)} accessory="none" />
      </ListSection>

      <ListSection header="RSVP">
        <ListRow title="참석" value={`${state.rsvpAttendingEmoji} ${state.rsvpAttendingLabel}`} accessory="none" />
        <ListRow title="미정" value={`${state.rsvpMaybeEmoji} ${state.rsvpMaybeLabel}`} accessory="none" />
        <ListRow title="불참" value={`${state.rsvpDeclinedEmoji} ${state.rsvpDeclinedLabel}`} accessory="none" />
        <ListRow title="응답 마감" value={formatDateTime(state.rsvpDeadlineAt)} accessory="none" />
      </ListSection>

      <ListSection header="공개 설정">
        <ListRow title="공개 초대장" value={state.isPublic ? '공개' : '비공개'} accessory="none" />
        <ListRow title="입장 비밀번호" value={state.accessPassword ? '설정됨' : '없음'} accessory="none" />
      </ListSection>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Button title="초대장 만들기" onPress={handleCreate} loading={isPending} style={styles.createButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: iosMetrics.spacing[10],
  },
  intro: {
    ...iosType.subhead,
    color: ios.secondaryLabel,
    paddingHorizontal: iosMetrics.pagePadding,
    marginTop: iosMetrics.spacing[4],
  },
  errorBox: {
    marginHorizontal: iosMetrics.pagePadding,
    marginTop: iosMetrics.spacing[5],
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.md,
    paddingHorizontal: iosMetrics.spacing[4],
    paddingVertical: iosMetrics.spacing[3],
  },
  errorText: {
    ...iosType.subhead,
    color: ios.systemRed,
    textAlign: 'center',
  },
  createButton: {
    marginHorizontal: iosMetrics.pagePadding,
    marginTop: iosMetrics.spacing[8],
  },
});
