/**
 * 초대장 생성 5단계 — RSVP 버튼(참석/미정/불참) 이모지·라벨 + 마감일 + 공개/비밀번호.
 * 마감일은 별도 피커 의존성 없이 TextInput('YYYY-MM-DD HH:mm')으로 입력.
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

import { Button, ListRow, ListSection, Screen } from '@/components/ios';
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

function isoToDisplay(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type RsvpRow = {
  key: string;
  title: string;
  emoji: string;
  label: string;
  onEmoji: (v: string) => void;
  onLabel: (v: string) => void;
};

export default function RsvpStep() {
  const router = useRouter();
  const [state, patch] = useCreateInvitationFlow();
  const [deadlineText, setDeadlineText] = useState(() => isoToDisplay(state.rsvpDeadlineAt));

  const rows: RsvpRow[] = [
    {
      key: 'attending',
      title: '참석',
      emoji: state.rsvpAttendingEmoji,
      label: state.rsvpAttendingLabel,
      onEmoji: (v) => patch({ rsvpAttendingEmoji: v }),
      onLabel: (v) => patch({ rsvpAttendingLabel: v }),
    },
    {
      key: 'maybe',
      title: '미정',
      emoji: state.rsvpMaybeEmoji,
      label: state.rsvpMaybeLabel,
      onEmoji: (v) => patch({ rsvpMaybeEmoji: v }),
      onLabel: (v) => patch({ rsvpMaybeLabel: v }),
    },
    {
      key: 'declined',
      title: '불참',
      emoji: state.rsvpDeclinedEmoji,
      label: state.rsvpDeclinedLabel,
      onEmoji: (v) => patch({ rsvpDeclinedEmoji: v }),
      onLabel: (v) => patch({ rsvpDeclinedLabel: v }),
    },
  ];

  function handleDeadlineChange(text: string) {
    setDeadlineText(text);
    patch({ rsvpDeadlineAt: parseLocalDateTime(text) });
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll background="grouped" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>응답 버튼</Text>
        <View style={styles.card}>
          {rows.map((row, i) => (
            <View key={row.key} style={[styles.rsvpRow, i < rows.length - 1 && styles.rowDivider]}>
              <Text style={styles.rsvpTitle}>{row.title}</Text>
              <TextInput
                style={styles.emojiInput}
                value={row.emoji}
                onChangeText={row.onEmoji}
                maxLength={4}
                textAlign="center"
              />
              <TextInput
                style={styles.labelInput}
                value={row.label}
                onChangeText={row.onLabel}
                placeholder="문구"
                placeholderTextColor={ios.tertiaryLabel}
                maxLength={20}
              />
            </View>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.sectionLabel}>응답 마감</Text>
          <TextInput
            style={styles.input}
            placeholder="예) 2026-06-30 23:59"
            placeholderTextColor={ios.tertiaryLabel}
            value={deadlineText}
            onChangeText={handleDeadlineChange}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />
          <Text style={styles.hint}>YYYY-MM-DD HH:mm 형식 (선택).</Text>
        </View>

        <ListSection>
          <ListRow
            title="공개 초대장"
            subtitle="지역 기반 탐색에 노출돼요"
            switchValue={state.isPublic}
            onSwitchChange={(v) => patch({ isPublic: v })}
          />
        </ListSection>

        <View style={styles.field}>
          <Text style={styles.sectionLabel}>입장 비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="설정하지 않으려면 비워두세요"
            placeholderTextColor={ios.tertiaryLabel}
            value={state.accessPassword ?? ''}
            onChangeText={(v) => patch({ accessPassword: v.length > 0 ? v : undefined })}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <Button
          title="다음"
          onPress={() => router.push('/invitations/create/share')}
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
  sectionLabel: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginLeft: iosMetrics.spacing[1],
  },
  card: {
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    overflow: 'hidden',
  },
  rsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.spacing[4],
    paddingVertical: iosMetrics.spacing[3],
  },
  rowDivider: {
    borderBottomWidth: iosMetrics.hairline,
    borderBottomColor: ios.separator,
  },
  rsvpTitle: {
    ...iosType.body,
    color: ios.label,
    width: 44,
  },
  emojiInput: {
    width: 52,
    ...iosType.title3,
    color: ios.label,
    backgroundColor: ios.tertiarySystemFill,
    borderRadius: iosMetrics.radius.sm,
    paddingVertical: iosMetrics.spacing[1],
  },
  labelInput: {
    flex: 1,
    ...iosType.body,
    color: ios.label,
    backgroundColor: ios.tertiarySystemFill,
    borderRadius: iosMetrics.radius.sm,
    paddingHorizontal: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[2],
  },
  field: { gap: iosMetrics.spacing[2] },
  input: {
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.md,
    paddingHorizontal: iosMetrics.spacing[4],
    paddingVertical: iosMetrics.spacing[3],
    ...iosType.body,
    color: ios.label,
  },
  hint: {
    ...iosType.caption1,
    color: ios.tertiaryLabel,
    marginLeft: iosMetrics.spacing[1],
  },
  nextButton: {
    marginTop: iosMetrics.spacing[2],
  },
});
