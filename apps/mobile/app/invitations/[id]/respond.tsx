/**
 * 초대장 응답 화면 — 웹 PublicInvitation/PublicInvitationContainer 미러.
 * 제목+날짜 카드 → RSVP(RsvpControl) → 이름·요청사항 → 맞춤 질문 → 제출.
 * 제출 완료 시 진행 중 투표가 있으면 투표 화면으로, 없으면 상세로 replace.
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { WaraApiError, fetchMe, updateMe, userKeys, type Invitation, type RsvpStatus } from '@/api';
import { getQuestions, questionKeys, submitAnswers, type QuestionAnswerInput } from '@/api/questions';
import { RsvpControl } from '@/components/invitation/RsvpControl';
import { Button, Screen, haptics } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useInvitation } from '@/hooks/queries/invitations';
import { useJoinInvitation, useMyParticipant } from '@/hooks/queries/participants';
import { ios, iosMetrics, iosType } from '@/theme';

const NOTE_MAX = 200;
const ANSWER_MAX = 500;

function messageForError(err: unknown): string {
  if (err instanceof WaraApiError) {
    switch (err.code) {
      case 'INVITATION_CLOSED':
        return '마감된 초대장이에요';
      case 'INVITATION_NOT_FOUND':
        return '초대장을 찾을 수 없어요';
      case 'INVITATION_ACCESS_REVOKED':
        return '이 초대장에 접근할 수 없어요';
      case 'RSVP_PERMISSION_DENIED':
        return '응답 권한이 없어요';
    }
    return '문제가 발생했어요';
  }
  return '네트워크 오류 — 잠시 후 다시 시도해주세요';
}

/** ISO → '2026년 7월 5일 (토)'. */
function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

/** 응답 완료 후 목적지 — 진행 중 투표가 있으면 투표, 없으면 상세 (웹 resolvePostRsvpRoute 미러). */
function postSubmitPath(invitation: Invitation): Href {
  return invitation.dateVotePollStatus === 'open'
    ? { pathname: '/invitations/[id]/vote', params: { id: invitation.id } }
    : { pathname: '/invitations/[id]', params: { id: invitation.id } };
}

export default function RespondScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const invitationQuery = useInvitation(id);
  const myParticipantQuery = useMyParticipant(id);
  const join = useJoinInvitation(id);
  const meQuery = useQuery({
    queryKey: userKeys.me(),
    queryFn: ({ signal }) => fetchMe(signal),
  });

  const inv = invitationQuery.data;
  // 아직 응답 전이면 attending 기본 선택 (웹 기본값 미러). RsvpControl 응답 시 상세 캐시로 동기화.
  const rsvp: RsvpStatus = inv?.myRsvpStatus ?? 'attending';

  const questionsQuery = useQuery({
    queryKey: questionKeys.list(id),
    queryFn: ({ signal }) => getQuestions(id, { signal }),
    enabled: !!id && rsvp !== 'absent',
  });
  const submitAnswersMutation = useMutation({
    mutationFn: (answers: QuestionAnswerInput[]) => submitAnswers(id, answers),
  });

  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const originalName = useRef('');
  const prefilled = useRef(false);

  // 내 표시 이름 프리필 (1회) — 웹 getMe 프리필 미러.
  useEffect(() => {
    const me = meQuery.data;
    if (!me || prefilled.current) return;
    prefilled.current = true;
    const display = me.nickname ?? me.name ?? '';
    setName(display);
    originalName.current = display;
  }, [meQuery.data]);

  // 이미 응답(불참 제외)한 참가자는 진입 시 투표/상세로 — 최초 로드 1회만 판정.
  // (화면 안 RsvpControl 응답으로 참가자가 되어도 재발동하지 않음)
  const redirected = useRef(false);
  useEffect(() => {
    if (redirected.current) return;
    if (!inv || myParticipantQuery.isPending) return;
    redirected.current = true;
    const participant = myParticipantQuery.data;
    if (participant && participant.rsvpStatus !== 'absent') {
      router.replace(postSubmitPath(inv));
    }
  }, [inv, myParticipantQuery.isPending, myParticipantQuery.data, router]);

  if (invitationQuery.isPending || myParticipantQuery.isPending) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '응답하기' }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (invitationQuery.error || !inv) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '응답하기' }} />
        <Text style={styles.errorTitle}>초대장을 찾을 수 없어요</Text>
        <Text style={styles.errorBody}>{messageForError(invitationQuery.error)}</Text>
      </View>
    );
  }

  // RSVP 마감 — 마감일 경과 또는 초대장 마감이면 신규 응답·변경 불가 (웹 미러).
  const deadlinePassed = Boolean(
    inv.rsvpDeadlineAt && new Date(inv.rsvpDeadlineAt).getTime() < Date.now(),
  );
  const isRsvpClosed = deadlinePassed || inv.status === 'closed';
  const deadlineText = inv.rsvpDeadlineAt
    ? new Date(inv.rsvpDeadlineAt).toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const onSubmit = async () => {
    if (submitting || isRsvpClosed) return;
    setSubmitting(true);
    try {
      // 1) 이름 변경 — 실패해도 응답은 진행 (웹과 동일 정책).
      const trimmedName = name.trim();
      if (trimmedName && trimmedName !== originalName.current) {
        try {
          await updateMe({ name: trimmedName });
          originalName.current = trimmedName;
          queryClient.invalidateQueries({ queryKey: userKeys.me() });
        } catch {
          // no-op
        }
      }

      // 2) 미참가자면 join(요청사항 포함). RsvpControl로 이미 참가했으면 생략
      //    (note는 join 시에만 저장 가능한 서버 계약).
      if (!myParticipantQuery.data) {
        try {
          await join.mutateAsync({ rsvpStatus: rsvp, note: note.trim() || undefined });
        } catch (err) {
          if (!(err instanceof WaraApiError && err.code === 'PARTICIPANT_ALREADY_EXISTS')) {
            haptics.error();
            Alert.alert('알림', messageForError(err));
            return;
          }
        }
      }

      // 3) 맞춤 질문 답변 — 실패해도 참가는 유지 (웹과 동일 정책).
      if (rsvp !== 'absent') {
        const entries = Object.entries(answers)
          .map(([questionId, answer]) => ({ questionId, answer: answer.trim() }))
          .filter((entry) => entry.answer.length > 0);
        if (entries.length > 0) {
          try {
            await submitAnswersMutation.mutateAsync(entries);
          } catch {
            // no-op
          }
        }
      }

      haptics.success();
      router.replace(
        rsvp === 'absent'
          ? { pathname: '/invitations/[id]', params: { id: inv.id } }
          : postSubmitPath(inv),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const questions = questionsQuery.data ?? [];

  return (
    <Screen scroll keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: '응답하기' }} />
      <View style={styles.body}>
        {/* 제목 + 날짜 카드 */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <IconSymbol name="calendar" size={20} color={ios.tint} />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle} numberOfLines={2}>
              {inv.title}
            </Text>
            {inv.eventStartAt ? (
              <Text style={styles.infoDate}>{formatEventDate(inv.eventStartAt)}</Text>
            ) : null}
          </View>
        </View>

        {/* RSVP */}
        <View style={styles.section}>
          <RsvpControl invitation={inv} />
          {deadlineText ? (
            <Text style={[styles.deadline, deadlinePassed && styles.deadlineClosed]}>
              {deadlinePassed ? '응답이 마감됐어요' : `응답 마감 · ${deadlineText}`}
            </Text>
          ) : null}
        </View>

        {rsvp !== 'absent' ? (
          <>
            <Field label="이름">
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="이름을 입력해주세요"
                placeholderTextColor={ios.placeholderText}
                editable={!submitting}
                accessibilityLabel="이름"
              />
            </Field>

            <Field label="요청사항" footer={`호스트에게 전달할 내용을 입력해주세요 · ${note.length}/${NOTE_MAX}`}>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={note}
                onChangeText={setNote}
                placeholder="요청사항을 입력해주세요"
                placeholderTextColor={ios.placeholderText}
                maxLength={NOTE_MAX}
                multiline
                editable={!submitting}
                accessibilityLabel="요청사항"
              />
            </Field>

            {questions.map((q) => (
              <Field key={q.id} label={q.required ? `${q.question} *` : q.question}>
                <TextInput
                  style={styles.input}
                  value={answers[q.id] ?? ''}
                  onChangeText={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
                  placeholder="답변을 입력해주세요"
                  placeholderTextColor={ios.placeholderText}
                  maxLength={ANSWER_MAX}
                  editable={!submitting}
                  accessibilityLabel={q.question}
                />
              </Field>
            ))}
          </>
        ) : null}

        <View style={styles.section}>
          <Button
            title={isRsvpClosed ? '응답 마감' : '응답하기'}
            onPress={() => void onSubmit()}
            loading={submitting}
            disabled={isRsvpClosed}
          />
        </View>
      </View>
    </Screen>
  );
}

function Field({
  label,
  footer,
  children,
}: {
  label: string;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {footer ? <Text style={styles.fieldFooter}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemBackground,
  },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.footnote, color: ios.secondaryLabel, textAlign: 'center' },

  body: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingTop: iosMetrics.spacing[5],
    paddingBottom: iosMetrics.spacing[10],
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    borderRadius: iosMetrics.radius.lg,
    backgroundColor: ios.secondarySystemGroupedBackground,
    padding: iosMetrics.spacing[4],
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: iosMetrics.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ios.tertiarySystemFill,
  },
  infoText: { flex: 1, minWidth: 0, gap: 2 },
  infoTitle: { ...iosType.headline, color: ios.label },
  infoDate: { ...iosType.footnote, color: ios.secondaryLabel },

  section: { marginTop: iosMetrics.spacing[6], gap: iosMetrics.spacing[2] },
  deadline: { ...iosType.footnote, color: ios.secondaryLabel },
  deadlineClosed: { color: ios.systemRed },

  field: { marginTop: iosMetrics.spacing[6], gap: iosMetrics.spacing[2] },
  fieldLabel: { ...iosType.subhead, fontWeight: '600', color: ios.label },
  fieldFooter: { ...iosType.footnote, color: ios.secondaryLabel },
  input: {
    ...iosType.body,
    color: ios.label,
    minHeight: 44,
    borderRadius: iosMetrics.radius.md,
    backgroundColor: ios.tertiarySystemFill,
    paddingHorizontal: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[3],
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
});
