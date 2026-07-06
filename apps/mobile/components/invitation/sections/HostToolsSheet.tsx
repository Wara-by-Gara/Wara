/**
 * 호스트 도구 시트 — 웹 HostView 더보기 BottomSheet 메뉴 미러.
 * 1차 메뉴는 네이티브 액션 시트(showActionSheet), 하위 도구는 BottomSheet/Alert/라우팅.
 * 수정 · 단체 공지 · 맞춤 질문 · 복제 · 재모임 · 응답 마감/재개 · 삭제.
 * (플라이어 만들기는 웹 전용 캔버스 흐름이라 생략)
 */

import { useRouter } from 'expo-router';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { WaraApiError, type Invitation } from '@/api';
import type { InvitationQuestion, QuestionAnswer } from '@/api/questionnaire';
import {
  BottomSheet,
  Button,
  haptics,
  showActionSheet,
  type BottomSheetRef,
} from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  useCloneInvitation,
  useDeleteInvitation,
  useUpdateInvitationStatus,
} from '@/hooks/queries/invitations';
import {
  useCreateQuestion,
  useDeleteQuestion,
  useQuestionAnswers,
  useQuestions,
} from '@/hooks/queries/questionnaire';
import { useCreateTextBlast, useTextBlasts } from '@/hooks/queries/textBlast';
import { ios, iosMetrics, iosType } from '@/theme';

/** WaraApiError code → 사용자 문구. */
function messageForError(error: unknown): string {
  if (error instanceof WaraApiError) {
    switch (error.code) {
      case 'INVITATION_HAS_PARTICIPANTS':
        return '참석자가 있는 초대장은 삭제할 수 없어요';
      case 'INSUFFICIENT_ROLE':
        return '호스트만 사용할 수 있어요';
      case 'TEXT_BLAST_NOT_FOUND':
        return '공지를 찾을 수 없어요';
      case 'QUESTION_NOT_FOUND':
        return '질문을 찾을 수 없어요';
      case 'VALIDATION_ERROR':
        return '입력값을 확인해주세요';
      case 'IDEMPOTENCY_IN_PROGRESS':
        return '이미 처리 중이에요. 잠시 후 다시 시도해주세요';
      default:
        return '문제가 발생했어요. 다시 시도해주세요';
    }
  }
  return '네트워크 오류 — 잠시 후 다시 시도해주세요';
}

export type HostToolsSheetRef = {
  /** 호스트 도구 1차 메뉴(액션 시트) 열기. */
  present: () => void;
};

type HostToolsSheetProps = {
  invitation: Invitation;
};

/**
 * 사용: `const ref = useRef<HostToolsSheetRef>(null); ref.current?.present();`
 * 호스트(myRole === 'HOST') 화면에서만 렌더링할 것.
 */
export const HostToolsSheet = forwardRef<HostToolsSheetRef, HostToolsSheetProps>(
  ({ invitation }, ref) => {
    const router = useRouter();
    const invitationId = invitation.id;

    const textBlastSheetRef = useRef<BottomSheetRef>(null);
    const questionnaireSheetRef = useRef<BottomSheetRef>(null);
    // 시트를 한 번이라도 연 뒤에만 목록 쿼리 활성화 (불필요한 선조회 방지)
    const [textBlastOpened, setTextBlastOpened] = useState(false);
    const [questionnaireOpened, setQuestionnaireOpened] = useState(false);

    const cloneInvitation = useCloneInvitation();
    const updateStatus = useUpdateInvitationStatus(invitationId);
    const deleteInvitation = useDeleteInvitation();

    const alertError = (error: unknown) => {
      haptics.error();
      Alert.alert('알림', messageForError(error));
    };

    function handleClone() {
      cloneInvitation.mutate(invitationId, {
        onSuccess: (created) => {
          haptics.success();
          router.push(`/invitations/${created.id}/edit`);
        },
        onError: alertError,
      });
    }

    function handleToggleStatus() {
      updateStatus.mutate(invitation.status === 'closed' ? 'active' : 'closed', {
        onSuccess: () => haptics.success(),
        onError: alertError,
      });
    }

    function confirmDelete() {
      Alert.alert('초대장 삭제', '삭제하면 복구할 수 없어요. 정말 삭제할까요?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () =>
            deleteInvitation.mutate(invitationId, {
              onSuccess: () => {
                haptics.success();
                router.replace('/(tabs)');
              },
              onError: alertError,
            }),
        },
      ]);
    }

    useImperativeHandle(ref, () => ({
      present: () =>
        showActionSheet({
          title: invitation.title,
          options: [
            {
              label: '수정',
              onPress: () => router.push(`/invitations/${invitationId}/edit`),
            },
            {
              label: '단체 공지 보내기',
              onPress: () => {
                setTextBlastOpened(true);
                textBlastSheetRef.current?.present();
              },
            },
            {
              label: '맞춤 질문 관리',
              onPress: () => {
                setQuestionnaireOpened(true);
                questionnaireSheetRef.current?.present();
              },
            },
            { label: '초대장 복제', onPress: handleClone },
            {
              label: '재모임 만들기',
              onPress: () => router.push(`/invitations/${invitationId}/remeet`),
            },
            {
              label: invitation.status === 'closed' ? '참석 응답 다시 받기' : '참석 응답 마감',
              onPress: handleToggleStatus,
            },
            { label: '삭제', destructive: true, onPress: confirmDelete },
          ],
        }),
    }));

    return (
      <>
        <BottomSheet ref={textBlastSheetRef}>
          <TextBlastSheetContent invitationId={invitationId} enabled={textBlastOpened} />
        </BottomSheet>
        <BottomSheet ref={questionnaireSheetRef}>
          <QuestionnaireSheetContent invitationId={invitationId} enabled={questionnaireOpened} />
        </BottomSheet>
      </>
    );
  },
);

HostToolsSheet.displayName = 'HostToolsSheet';

// ── 단체 공지 (웹 TextBlastSheet 미러) ─────────────────────────────────────────

function formatBlastTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TextBlastSheetContent({
  invitationId,
  enabled,
}: {
  invitationId: string;
  enabled: boolean;
}) {
  const [message, setMessage] = useState('');
  const { data: blasts } = useTextBlasts(invitationId, { enabled });
  const createBlast = useCreateTextBlast(invitationId);

  function handleSend() {
    const trimmed = message.trim();
    if (!trimmed) return;
    createBlast.mutate(trimmed, {
      onSuccess: () => {
        haptics.success();
        setMessage('');
      },
      onError: (error) => {
        haptics.error();
        Alert.alert('알림', messageForError(error));
      },
    });
  }

  return (
    <View>
      <Text style={styles.sheetTitle}>단체 공지</Text>
      <Text style={styles.sheetCaption}>참석자 전원에게 알림으로 전달돼요</Text>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="참석자에게 전할 공지를 입력하세요"
        placeholderTextColor={ios.placeholderText}
        maxLength={500}
        multiline
        editable={!createBlast.isPending}
      />
      <Button
        title="공지 보내기"
        onPress={handleSend}
        loading={createBlast.isPending}
        disabled={!message.trim()}
      />
      {blasts && blasts.length > 0 ? (
        <View style={styles.historyBlock}>
          <Text style={styles.historyHeader}>보낸 공지</Text>
          {blasts.map((blast) => (
            <View key={blast.id} style={styles.historyCard}>
              <Text style={styles.historyMessage}>{blast.message}</Text>
              <Text style={styles.historyMeta}>
                {formatBlastTime(blast.createdAt)} · {blast.recipientCount}명
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ── 맞춤 질문 (웹 QuestionnaireSheet 미러) ─────────────────────────────────────

function QuestionnaireSheetContent({
  invitationId,
  enabled,
}: {
  invitationId: string;
  enabled: boolean;
}) {
  const [text, setText] = useState('');
  const { data: questions } = useQuestions(invitationId, { enabled });
  const { data: answersData } = useQuestionAnswers(invitationId, { enabled });
  const createQuestion = useCreateQuestion(invitationId);
  const removeQuestion = useDeleteQuestion(invitationId);

  const answersByQuestion = new Map<string, QuestionAnswer[]>(
    (answersData?.questions ?? []).map((q) => [q.id, q.answers]),
  );

  function handleAdd() {
    const question = text.trim();
    if (!question) return;
    createQuestion.mutate(
      { question },
      {
        onSuccess: () => {
          haptics.success();
          setText('');
        },
        onError: (error) => {
          haptics.error();
          Alert.alert('알림', messageForError(error));
        },
      },
    );
  }

  return (
    <View>
      <Text style={styles.sheetTitle}>맞춤 질문</Text>
      <Text style={styles.sheetCaption}>참석자가 응답할 때 답하는 질문이에요</Text>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, styles.addInput]}
          value={text}
          onChangeText={setText}
          placeholder="질문을 입력하세요 (예: 식사 알레르기 있나요?)"
          placeholderTextColor={ios.placeholderText}
          maxLength={200}
          editable={!createQuestion.isPending}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Button
          title="추가"
          variant="tinted"
          size="medium"
          onPress={handleAdd}
          loading={createQuestion.isPending}
          disabled={!text.trim()}
        />
      </View>
      {questions && questions.length > 0 ? (
        <View style={styles.questionList}>
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              answers={answersByQuestion.get(q.id) ?? []}
              onDelete={() =>
                removeQuestion.mutate(q.id, {
                  onError: (error) => {
                    haptics.error();
                    Alert.alert('알림', messageForError(error));
                  },
                })
              }
            />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>아직 질문이 없어요</Text>
      )}
    </View>
  );
}

function QuestionCard({
  question,
  answers,
  onDelete,
}: {
  question: InvitationQuestion;
  answers: QuestionAnswer[];
  onDelete: () => void;
}) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.questionRow}>
        <Text style={styles.historyMessage}>{question.question}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="질문 삭제"
          hitSlop={8}
          onPress={onDelete}>
          <IconSymbol name="xmark" size={14} color={ios.tertiaryLabel} weight="semibold" />
        </Pressable>
      </View>
      {answers.length > 0 ? (
        <View style={styles.answersBlock}>
          <Text style={styles.historyMeta}>응답 {answers.length}개</Text>
          {answers.map((a, i) => (
            <Text key={i} style={styles.answerText}>
              · {a.answer}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheetTitle: {
    ...iosType.headline,
    color: ios.label,
    marginTop: iosMetrics.spacing[2],
  },
  sheetCaption: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginTop: iosMetrics.spacing[1],
    marginBottom: iosMetrics.spacing[3],
  },
  input: {
    ...iosType.body,
    color: ios.label,
    minHeight: 88,
    borderRadius: iosMetrics.radius.md,
    backgroundColor: ios.tertiarySystemFill,
    padding: iosMetrics.spacing[3],
    marginBottom: iosMetrics.spacing[4],
    textAlignVertical: 'top',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: iosMetrics.spacing[2],
  },
  addInput: {
    flex: 1,
    minHeight: iosMetrics.minTouchTarget,
    marginBottom: 0,
  },
  questionList: {
    marginTop: iosMetrics.spacing[4],
    gap: iosMetrics.spacing[2],
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: iosMetrics.spacing[2],
  },
  historyBlock: {
    marginTop: iosMetrics.spacing[5],
    gap: iosMetrics.spacing[2],
  },
  historyHeader: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
  },
  historyCard: {
    backgroundColor: ios.tertiarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.md,
    padding: iosMetrics.spacing[3],
  },
  historyMessage: {
    ...iosType.subhead,
    color: ios.label,
    flex: 1,
  },
  historyMeta: {
    ...iosType.caption1,
    color: ios.secondaryLabel,
    marginTop: iosMetrics.spacing[1],
  },
  answersBlock: {
    marginTop: iosMetrics.spacing[2],
    borderTopWidth: iosMetrics.hairline,
    borderTopColor: ios.separator,
    paddingTop: iosMetrics.spacing[2],
    gap: 2,
  },
  answerText: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
  },
  empty: {
    ...iosType.subhead,
    color: ios.secondaryLabel,
    textAlign: 'center',
    paddingVertical: iosMetrics.spacing[6],
  },
});
