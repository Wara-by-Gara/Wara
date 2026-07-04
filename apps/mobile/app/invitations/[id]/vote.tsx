/**
 * 날짜 투표 화면 — 슬롯 목록·투표(선택/해제, 복수)·유력 슬롯 강조·마감/확정 상태.
 * 호스트: 투표 생성 / 슬롯 추가·삭제(길게 눌러) / 마감 / (공동1등) 확정.
 * 앱 크롬이므로 색상/메트릭은 theme 토큰과 components/ios 킷만 사용.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import {
  BottomSheet,
  Button,
  ListSection,
  Screen,
  haptics,
  showActionSheet,
  type BottomSheetRef,
} from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError } from '@/api';
import type { DateVoteSlot, PollStatus } from '@/api/dateVote';
import { useInvitation } from '@/hooks/queries/invitations';
import {
  useAddSlot,
  useClosePoll,
  useConfirmSlot,
  useCreatePoll,
  useDeleteSlot,
  usePoll,
  usePolls,
  useResults,
  useSubmitResponses,
} from '@/hooks/queries/dateVote';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** WaraApiError code → 한국어 안내. */
function messageForError(err: unknown): string {
  if (err instanceof WaraApiError) {
    switch (err.code) {
      case 'VOTE_POLL_NOT_FOUND':
        return '투표를 찾을 수 없어요';
      case 'VOTE_POLL_CLOSED':
        return '마감된 투표예요';
      case 'VOTE_POLL_ALREADY_EXISTS':
        return '이미 투표가 있어요';
      case 'VOTE_SLOT_NOT_FOUND':
        return '후보를 찾을 수 없어요';
      case 'VOTE_SLOT_LIMIT_EXCEEDED':
        return '후보는 최대 30개까지예요';
      case 'VOTE_SLOT_DUPLICATE':
        return '같은 후보가 이미 있어요';
      case 'VOTE_SLOT_TYPE_MISMATCH':
        return '날짜 형식이 올바르지 않아요';
      case 'VOTE_EVENT_DATE_SET':
        return '이미 날짜가 확정된 초대장이에요';
    }
  }
  return '문제가 발생했어요';
}

const STATUS_LABEL: Record<PollStatus, string> = {
  open: '진행 중',
  closed: '마감됨',
  confirmed: '확정됨',
};

/** 'YYYY-MM-DD' (+ 'HH:MM') → '7월 5일 (토) 15:00'. */
function formatSlot(slot: DateVoteSlot): string {
  if (!slot.date) return slot.label ?? '후보';
  const parsed = new Date(`${slot.date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return slot.date;
  const base = `${parsed.getMonth() + 1}월 ${parsed.getDate()}일 (${WEEKDAYS[parsed.getDay()]})`;
  return slot.startTime ? `${base} ${slot.startTime}` : base;
}

export default function VoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const invitationQuery = useInvitation(id);
  const isHost = invitationQuery.data?.myRole === 'HOST';

  const pollsQuery = usePolls(id);
  // 모바일은 날짜 투표만 다룬다 — 첫 date 폴을 활성 폴로 사용.
  const activePoll = useMemo(
    () => pollsQuery.data?.polls.find((p) => p.poll.voteType === 'date') ?? null,
    [pollsQuery.data],
  );
  const pollId = activePoll?.poll.id;

  const pollQuery = usePoll(id, pollId);
  const resultsQuery = useResults(id, pollId);

  const poll = pollQuery.data?.poll ?? activePoll?.poll ?? null;
  const slots = pollQuery.data?.slots ?? activePoll?.slots ?? [];
  const myResponses = pollQuery.data?.myResponses;

  const submit = useSubmitResponses(id);
  const createPoll = useCreatePoll(id);
  const addSlot = useAddSlot(id);
  const deleteSlot = useDeleteSlot(id);
  const closePoll = useClosePoll(id);
  const confirmSlot = useConfirmSlot(id);

  // 내 선택(good) — 서버 응답과 동기화 + 탭 시 낙관적 갱신.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!myResponses) return;
    setSelected(new Set(myResponses.filter((r) => r.response === 'good').map((r) => r.slotId)));
  }, [myResponses]);

  // 슬롯별 득표수 + 유력 슬롯.
  const goodCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of resultsQuery.data?.slotResults ?? []) map.set(r.slot.id, r.counts.good);
    return map;
  }, [resultsQuery.data]);
  const leadingCount = useMemo(() => {
    let max = 0;
    for (const c of goodCounts.values()) max = Math.max(max, c);
    return max;
  }, [goodCounts]);

  const addSheetRef = useRef<BottomSheetRef>(null);
  const [dateInput, setDateInput] = useState('');
  const [draftDates, setDraftDates] = useState<string[]>([]);

  const onMutationError = (err: unknown) => {
    haptics.error();
    Alert.alert('알림', messageForError(err));
  };

  function toggleVote(slotId: string) {
    if (!pollId || poll?.status !== 'open') return;
    const next = new Set(selected);
    if (next.has(slotId)) next.delete(slotId);
    else next.add(slotId);
    setSelected(next);
    haptics.selection();
    submit.mutate(
      {
        pollId,
        responses: [...next].map((sid) => ({ slotId: sid, response: 'good' as const })),
      },
      {
        onError: (err) => {
          onMutationError(err);
          pollQuery.refetch();
        },
      },
    );
  }

  function confirmSlotAction(slot: DateVoteSlot) {
    if (!pollId) return;
    showActionSheet({
      title: formatSlot(slot),
      message: '이 후보로 확정할까요?',
      options: [
        {
          label: '확정하기',
          onPress: () =>
            confirmSlot.mutate(
              { pollId, slotId: slot.id },
              { onSuccess: () => haptics.success(), onError: onMutationError },
            ),
        },
      ],
    });
  }

  function manageSlotAction(slot: DateVoteSlot) {
    if (!pollId) return;
    showActionSheet({
      title: formatSlot(slot),
      options: [
        {
          label: '후보 삭제',
          destructive: true,
          onPress: () =>
            deleteSlot.mutate(
              { pollId, slotId: slot.id },
              { onSuccess: () => haptics.success(), onError: onMutationError },
            ),
        },
      ],
    });
  }

  function onSlotPress(slot: DateVoteSlot) {
    if (poll?.status === 'closed' && isHost) confirmSlotAction(slot);
    else toggleVote(slot.id);
  }

  function onSlotLongPress(slot: DateVoteSlot) {
    if (isHost && poll?.status === 'open') manageSlotAction(slot);
  }

  function submitAddSlot() {
    if (!pollId) return;
    const value = dateInput.trim();
    if (!DATE_RE.test(value)) {
      Alert.alert('알림', 'YYYY-MM-DD 형식으로 입력해주세요');
      return;
    }
    addSlot.mutate(
      { pollId, body: { date: value } },
      {
        onSuccess: () => {
          haptics.success();
          setDateInput('');
          addSheetRef.current?.dismiss();
        },
        onError: onMutationError,
      },
    );
  }

  function addDraftDate() {
    const value = dateInput.trim();
    if (!DATE_RE.test(value)) {
      Alert.alert('알림', 'YYYY-MM-DD 형식으로 입력해주세요');
      return;
    }
    if (draftDates.includes(value)) {
      Alert.alert('알림', '이미 추가한 날짜예요');
      return;
    }
    setDraftDates((prev) => [...prev, value]);
    setDateInput('');
  }

  function createPollAction() {
    if (draftDates.length === 0) return;
    createPoll.mutate(
      {
        voteType: 'date',
        isAnonymous: false,
        slots: draftDates.map((d, i) => ({ date: d, sortOrder: i })),
      },
      {
        onSuccess: () => {
          haptics.success();
          setDraftDates([]);
        },
        onError: onMutationError,
      },
    );
  }

  const screenHeader = <Stack.Screen options={{ title: '날짜 투표', headerLargeTitle: true }} />;

  if (pollsQuery.isPending) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (pollsQuery.error) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(pollsQuery.error)}</Text>
        <Button title="다시 시도" onPress={() => pollsQuery.refetch()} />
      </View>
    );
  }

  // ── 폴 없음 ──────────────────────────────────────────────────────────────────
  if (!poll) {
    return (
      <>
        {screenHeader}
        <Screen background="grouped" scroll>
          {isHost ? (
            <View style={styles.createWrap}>
              <Text style={styles.createTitle}>날짜 투표 만들기</Text>
              <Text style={styles.createHint}>
                후보 날짜를 추가한 뒤 투표를 시작하세요. (YYYY-MM-DD)
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.dateInput}
                  value={dateInput}
                  onChangeText={setDateInput}
                  placeholder="2026-07-05"
                  placeholderTextColor={ios.placeholderText}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button title="추가" size="medium" variant="tinted" onPress={addDraftDate} />
              </View>

              {draftDates.length > 0 ? (
                <ListSection>
                  {draftDates.map((d) => (
                    <DraftRow
                      key={d}
                      label={formatSlot({
                        id: d,
                        pollId: '',
                        date: d,
                        startTime: null,
                        label: null,
                        sortOrder: 0,
                        createdAt: '',
                      })}
                      onRemove={() => setDraftDates((prev) => prev.filter((x) => x !== d))}
                    />
                  ))}
                </ListSection>
              ) : null}

              <View style={styles.createButton}>
                <Button
                  title="투표 시작"
                  onPress={createPollAction}
                  disabled={draftDates.length === 0}
                  loading={createPoll.isPending}
                />
              </View>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>진행 중인 투표가 없어요</Text>
            </View>
          )}
        </Screen>
      </>
    );
  }

  // ── 폴 있음 ──────────────────────────────────────────────────────────────────
  const isOpen = poll.status === 'open';
  const isClosed = poll.status === 'closed';
  const refreshing = pollQuery.isRefetching || resultsQuery.isRefetching;

  return (
    <>
      {screenHeader}
      <Screen
        background="grouped"
        scroll
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              pollQuery.refetch();
              resultsQuery.refetch();
            }}
          />
        }>
        <View style={styles.statusRow}>
          <View style={[styles.badge, styles[`badge_${poll.status}`]]}>
            <Text style={styles.badgeText}>{STATUS_LABEL[poll.status]}</Text>
          </View>
          <Text style={styles.hintText}>
            {isOpen
              ? '원하는 날짜를 모두 선택하세요'
              : isClosed
                ? isHost
                  ? '후보를 눌러 확정하세요'
                  : '호스트가 결과를 확정할 예정이에요'
                : '날짜가 확정됐어요'}
          </Text>
        </View>

        <ListSection footer={isHost && isOpen ? '후보를 길게 누르면 삭제할 수 있어요' : undefined}>
          {slots.map((slot) => (
            <SlotRow
              key={slot.id}
              label={formatSlot(slot)}
              count={goodCounts.get(slot.id) ?? 0}
              selected={selected.has(slot.id)}
              leading={leadingCount > 0 && (goodCounts.get(slot.id) ?? 0) === leadingCount}
              confirmed={poll.confirmedSlotId === slot.id}
              disabled={poll.status === 'confirmed'}
              onPress={() => onSlotPress(slot)}
              onLongPress={() => onSlotLongPress(slot)}
            />
          ))}
        </ListSection>

        {isHost ? (
          <View style={styles.hostActions}>
            {isOpen ? (
              <>
                <Button
                  title="후보 추가"
                  variant="tinted"
                  onPress={() => addSheetRef.current?.present()}
                />
                <Button
                  title="투표 마감"
                  variant="destructive"
                  onPress={() =>
                    showActionSheet({
                      title: '투표 마감',
                      message: '마감하면 더 이상 응답할 수 없어요.',
                      options: [
                        {
                          label: '마감하기',
                          destructive: true,
                          onPress: () =>
                            pollId &&
                            closePoll.mutate(pollId, {
                              onSuccess: () => haptics.success(),
                              onError: onMutationError,
                            }),
                        },
                      ],
                    })
                  }
                />
              </>
            ) : null}
          </View>
        ) : null}
      </Screen>

      <BottomSheet ref={addSheetRef}>
        <Text style={styles.sheetTitle}>후보 날짜 추가</Text>
        <TextInput
          style={styles.dateInput}
          value={dateInput}
          onChangeText={setDateInput}
          placeholder="2026-07-05"
          placeholderTextColor={ios.placeholderText}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.sheetButton}>
          <Button title="추가" onPress={submitAddSlot} loading={addSlot.isPending} />
        </View>
      </BottomSheet>
    </>
  );
}

/** 투표 슬롯 행 — 좌측 선택 체크, 우측 득표수/유력·확정 배지. */
function SlotRow({
  label,
  count,
  selected,
  leading,
  confirmed,
  disabled,
  onPress,
  onLongPress,
  isLast = false,
}: {
  label: string;
  count: number;
  selected: boolean;
  leading: boolean;
  confirmed: boolean;
  disabled: boolean;
  onPress: () => void;
  onLongPress: () => void;
  isLast?: boolean;
}) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        accessibilityRole="button"
        style={({ pressed }) => [styles.slotRow, pressed && styles.slotRowPressed]}>
        <IconSymbol
          name={selected ? 'checkmark.circle.fill' : 'circle'}
          size={22}
          color={selected ? ios.tint : ios.tertiaryLabel}
        />
        <Text style={styles.slotLabel} numberOfLines={1}>
          {label}
        </Text>
        {confirmed ? (
          <View style={[styles.pill, styles.pillConfirmed]}>
            <Text style={styles.pillText}>확정</Text>
          </View>
        ) : leading ? (
          <View style={[styles.pill, styles.pillLeading]}>
            <Text style={styles.pillText}>유력</Text>
          </View>
        ) : null}
        <Text style={styles.slotCount}>{count}표</Text>
      </Pressable>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}

/** 투표 생성 전 후보 초안 행. */
function DraftRow({
  label,
  onRemove,
  isLast = false,
}: {
  label: string;
  onRemove: () => void;
  isLast?: boolean;
}) {
  return (
    <View>
      <View style={styles.slotRow}>
        <Text style={styles.slotLabel} numberOfLines={1}>
          {label}
        </Text>
        <Pressable onPress={onRemove} accessibilityRole="button" hitSlop={8}>
          <IconSymbol name="minus.circle.fill" size={22} color={ios.systemRed} />
        </Pressable>
      </View>
      {!isLast ? <View style={styles.separator} /> : null}
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
    backgroundColor: ios.systemGroupedBackground,
  },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },

  empty: { alignItems: 'center', paddingVertical: iosMetrics.spacing[16] },
  emptyText: { ...iosType.subhead, color: ios.secondaryLabel },

  // 생성 플로우
  createWrap: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingTop: iosMetrics.spacing[4],
    gap: iosMetrics.spacing[2],
  },
  createTitle: { ...iosType.title3, color: ios.label },
  createHint: { ...iosType.footnote, color: ios.secondaryLabel },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[2],
    marginTop: iosMetrics.spacing[2],
  },
  createButton: { marginTop: iosMetrics.spacing[5] },

  // 상태
  statusRow: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingTop: iosMetrics.spacing[4],
    gap: iosMetrics.spacing[2],
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: iosMetrics.radius.full,
    paddingHorizontal: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[1],
  },
  badge_open: { backgroundColor: ios.tint },
  badge_closed: { backgroundColor: ios.systemFill },
  badge_confirmed: { backgroundColor: ios.systemGreen },
  badgeText: { ...iosType.caption1, color: '#FFFFFF', fontWeight: '600' },
  hintText: { ...iosType.footnote, color: ios.secondaryLabel },

  // 슬롯 행
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    minHeight: iosMetrics.rowMinHeight,
    paddingHorizontal: iosMetrics.spacing[4],
    paddingVertical: iosMetrics.spacing[2],
  },
  slotRowPressed: { backgroundColor: ios.systemFill },
  slotLabel: { ...iosType.body, color: ios.label, flex: 1 },
  slotCount: { ...iosType.subhead, color: ios.secondaryLabel },
  pill: {
    borderRadius: iosMetrics.radius.full,
    paddingHorizontal: iosMetrics.spacing[2],
    paddingVertical: 2,
  },
  pillLeading: { backgroundColor: ios.tertiarySystemFill },
  pillConfirmed: { backgroundColor: ios.systemGreen },
  pillText: { ...iosType.caption2, color: ios.label, fontWeight: '600' },
  separator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: iosMetrics.spacing[4],
  },

  hostActions: {
    paddingHorizontal: iosMetrics.pagePadding,
    marginTop: iosMetrics.spacing[6],
    gap: iosMetrics.spacing[3],
  },

  // 시트
  sheetTitle: {
    ...iosType.headline,
    color: ios.label,
    marginBottom: iosMetrics.spacing[3],
    marginTop: iosMetrics.spacing[2],
  },
  dateInput: {
    ...iosType.body,
    color: ios.label,
    flex: 1,
    minHeight: 44,
    borderRadius: iosMetrics.radius.md,
    backgroundColor: ios.tertiarySystemFill,
    paddingHorizontal: iosMetrics.spacing[3],
  },
  sheetButton: { marginTop: iosMetrics.spacing[4] },
});
