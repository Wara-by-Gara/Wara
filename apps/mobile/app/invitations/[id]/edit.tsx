/**
 * 초대장 편집 (F-PFLCKA) — 웹 /invitations/[invitationId]/edit 미러.
 * 웹은 생성 컨테이너 재사용(editInvitation 주입)이지만, 모바일 생성 마법사는 스텝별
 * 화면이 다음 create 라우트로 하드 push하고 마지막 스텝이 생성 API를 호출하는 구조라
 * 재사용이 어렵다 → 기본정보(제목/설명/일시/회비/드레스코드/주차) 단일 폼으로 범위 축소.
 *
 * - HOST(공동호스트 포함, myRole === 'HOST')만 편집 가능
 * - 낙관적 락: 조회 시점 updatedAt을 expectedUpdatedAt으로 echo.
 *   409 INVITATION_VERSION_CONFLICT 시 안내 + 상세 재조회(다음 저장은 갱신된 값으로 통과).
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { WaraApiError, invitationKeys, type Invitation } from '@/api';
import { Button, Screen, haptics } from '@/components/ios';
import { useInvitation, useUpdateInvitation } from '@/hooks/queries/invitations';
import { ios, iosMetrics, iosType } from '@/theme';

/** 'YYYY-MM-DD HH:mm' → 로컬시간 ISO 문자열. 파싱 실패 시 undefined. (create/basics와 동일 형식) */
function parseLocalDateTime(text: string): string | undefined {
  const match = text.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return undefined;
  const [, y, mo, d, h, mi] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

/** ISO → 'YYYY-MM-DD HH:mm' 로컬 표시 문자열. */
function isoToDisplay(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** WaraApiError 코드 → 사용자 문구. (충돌은 handleSave에서 별도 분기) */
function messageForError(error: unknown): string {
  if (error instanceof WaraApiError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return '입력값을 확인해주세요.';
      case 'INSUFFICIENT_ROLE':
        return '호스트만 초대장을 편집할 수 있어요.';
      case 'IDEMPOTENCY_IN_PROGRESS':
        return '이미 처리 중이에요. 잠시 후 다시 시도해주세요.';
      case 'INVITATION_NOT_FOUND':
        return '초대장을 찾을 수 없어요.';
      default:
        return '문제가 발생했어요. 다시 시도해주세요.';
    }
  }
  return '문제가 발생했어요. 다시 시도해주세요.';
}

export default function EditInvitationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, error } = useInvitation(id);

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.noticeTitle}>불러오기 실패</Text>
        <Text style={styles.noticeBody}>
          {error instanceof WaraApiError
            ? messageForError(error)
            : '네트워크 오류 — 잠시 후 다시 시도해 주세요'}
        </Text>
      </View>
    );
  }

  // 웹의 권한 분기 미러 — HOST(공동호스트 포함)만 편집 가능.
  if (data.myRole !== 'HOST') {
    return (
      <View style={styles.center}>
        <Text style={styles.noticeTitle}>편집 권한이 없어요</Text>
        <Text style={styles.noticeBody}>호스트만 초대장을 편집할 수 있어요.</Text>
      </View>
    );
  }

  return <EditForm invitation={data} />;
}

function EditForm({ invitation }: { invitation: Invitation }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending: isSaving } = useUpdateInvitation(invitation.id);

  const [title, setTitle] = useState(invitation.title);
  const [description, setDescription] = useState(invitation.description);
  const [dateText, setDateText] = useState(() => isoToDisplay(invitation.eventStartAt));
  const [fee, setFee] = useState(invitation.fee ?? '');
  const [dressCode, setDressCode] = useState(invitation.dressCode ?? '');
  const [parkingInfo, setParkingInfo] = useState(invitation.parkingInfo ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSave = title.trim().length > 0;

  async function handleSave() {
    setErrorMessage(null);

    const trimmedDate = dateText.trim();
    const eventStartAt = trimmedDate ? parseLocalDateTime(trimmedDate) : null;
    if (trimmedDate && !eventStartAt) {
      setErrorMessage('일시는 YYYY-MM-DD HH:mm 형식으로 입력해주세요.');
      return;
    }

    try {
      await mutateAsync({
        // 낙관적 락: 최근 조회 updatedAt echo. 충돌 시 서버가 409로 덮어쓰기 방지.
        expectedUpdatedAt: invitation.updatedAt,
        title: title.trim(),
        description: description.trim(),
        eventStartAt,
        fee: fee.trim() || null,
        dressCode: dressCode.trim() || null,
        parkingInfo: parkingInfo.trim() || null,
      });
      haptics.success();
      router.back();
    } catch (err) {
      haptics.error();
      if (err instanceof WaraApiError && err.code === 'INVITATION_VERSION_CONFLICT') {
        // 다른 세션이 먼저 수정 — 상세 재조회로 updatedAt을 갱신해 다음 저장이 통과되게 한다.
        setErrorMessage('다른 기기에서 수정됐어요. 새로고침 후 다시 시도해주세요.');
        void queryClient.invalidateQueries({
          queryKey: invitationKeys.detail(invitation.id),
        });
        return;
      }
      setErrorMessage(messageForError(err));
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Stack.Screen options={{ title: '초대장 편집' }} />
      <Screen
        scroll
        background="grouped"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="모임 이름을 입력하세요"
            placeholderTextColor={ios.tertiaryLabel}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="모임에 대해 소개해주세요"
            placeholderTextColor={ios.tertiaryLabel}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>일시</Text>
          <TextInput
            style={styles.input}
            placeholder="예) 2026-07-01 19:00"
            placeholderTextColor={ios.tertiaryLabel}
            value={dateText}
            onChangeText={setDateText}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            returnKeyType="done"
          />
          <Text style={styles.hint}>YYYY-MM-DD HH:mm 형식으로 입력하세요. 비우면 일시가 제거돼요.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>회비</Text>
          <TextInput
            style={styles.input}
            placeholder="예) 1인 20,000원"
            placeholderTextColor={ios.tertiaryLabel}
            value={fee}
            onChangeText={setFee}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>드레스코드</Text>
          <TextInput
            style={styles.input}
            placeholder="예) 화이트 톤"
            placeholderTextColor={ios.tertiaryLabel}
            value={dressCode}
            onChangeText={setDressCode}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>주차 안내</Text>
          <TextInput
            style={styles.input}
            placeholder="예) 건물 지하 2시간 무료"
            placeholderTextColor={ios.tertiaryLabel}
            value={parkingInfo}
            onChangeText={setParkingInfo}
            returnKeyType="done"
          />
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Button
          title="저장"
          onPress={handleSave}
          disabled={!canSave}
          loading={isSaving}
          style={styles.saveButton}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemBackground,
  },
  noticeTitle: { ...iosType.headline, color: ios.label },
  noticeBody: { ...iosType.footnote, color: ios.secondaryLabel, textAlign: 'center' },
  content: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
    gap: iosMetrics.spacing[5],
  },
  field: { gap: iosMetrics.spacing[2] },
  label: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginLeft: iosMetrics.spacing[1],
  },
  input: {
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.md,
    paddingHorizontal: iosMetrics.spacing[4],
    paddingVertical: iosMetrics.spacing[3],
    ...iosType.body,
    color: ios.label,
  },
  multiline: {
    minHeight: 96,
  },
  hint: {
    ...iosType.caption1,
    color: ios.tertiaryLabel,
    marginLeft: iosMetrics.spacing[1],
  },
  errorBox: {
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
  saveButton: {
    marginTop: iosMetrics.spacing[4],
  },
});
