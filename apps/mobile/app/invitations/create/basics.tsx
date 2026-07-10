/**
 * 초대장 생성 2단계 — 기본 정보(제목/설명/일시).
 * 일시는 별도 날짜 피커 의존성 없이 TextInput('YYYY-MM-DD HH:mm')으로 간단히 입력받는다.
 * 제목이 비어 있으면 다음으로 진행 불가.
 */

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen } from '@/components/ios';
import { useCreateInvitationFlow } from '@/hooks/useCreateInvitationFlow';
import { ios, iosMetrics, iosType } from '@/theme';

/** 'YYYY-MM-DD HH:mm' → 로컬시간 ISO 문자열. 파싱 실패 시 undefined. */
function parseLocalDateTime(text: string): string | undefined {
  const match = text.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return undefined;
  const [, y, mo, d, h, mi] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

/** ISO → 'YYYY-MM-DD HH:mm' 로컬 표시 문자열. */
function isoToDisplay(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function BasicsStep() {
  const router = useRouter();
  const [state, patch] = useCreateInvitationFlow();
  const [dateText, setDateText] = useState(() => isoToDisplay(state.eventStartAt));

  const canProceed = state.title.trim().length > 0;

  function handleDateChange(text: string) {
    setDateText(text);
    patch({ eventStartAt: parseLocalDateTime(text) });
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll background="grouped" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="모임 이름을 입력하세요"
            placeholderTextColor={ios.tertiaryLabel}
            value={state.title}
            onChangeText={(v) => patch({ title: v })}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="모임에 대해 소개해주세요"
            placeholderTextColor={ios.tertiaryLabel}
            value={state.description}
            onChangeText={(v) => patch({ description: v })}
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
            onChangeText={handleDateChange}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            returnKeyType="done"
          />
          <Text style={styles.hint}>YYYY-MM-DD HH:mm 형식으로 입력하세요 (선택).</Text>
        </View>

        <Button
          title="다음"
          onPress={() => router.push('/invitations/create/design')}
          disabled={!canProceed}
          style={styles.nextButton}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  nextButton: {
    marginTop: iosMetrics.spacing[4],
  },
});
