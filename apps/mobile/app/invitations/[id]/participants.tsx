/**
 * 참가자 관리 화면 — RSVP 필터·목록·(호스트) 역할/메모/제거 액션.
 * 앱 크롬이므로 색상/메트릭은 theme 토큰과 components/ios 킷만 사용.
 */

import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import {
  BottomSheet,
  Button,
  ListSection,
  Screen,
  SegmentedControl,
  haptics,
  showActionSheet,
  type BottomSheetRef,
} from '@/components/ios';
import { ParticipantRow } from '@/components/invitation/ParticipantRow';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError, type ParticipantsResponse, type RsvpStatus } from '@/api';
import {
  useLeaveInvitation,
  useParticipants,
  useSetCoHost,
  useTransferHost,
  useUpdateHostMemo,
} from '@/hooks/queries/participants';
import { useInvitation } from '@/hooks/queries/invitations';

type Entry = ParticipantsResponse['participants'][number];

const FILTERS: (RsvpStatus | 'all')[] = ['all', 'attending', 'undecided', 'absent'];

/** WaraApiError code → 한국어 안내. */
function messageForError(err: unknown): string {
  if (err instanceof WaraApiError) {
    switch (err.code) {
      case 'OWNER_CANNOT_BE_DEMOTED':
        return '소유자는 해제할 수 없어요';
      case 'PARTICIPANT_NOT_ATTENDING':
        return '참석 상태만 가능해요';
      case 'HOST_CANNOT_LEAVE':
        return '호스트는 나갈 수 없어요';
      case 'PARTICIPANT_ALREADY_HOST':
        return '이미 호스트예요';
    }
  }
  return '문제가 발생했어요';
}

export default function ParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const participantsQuery = useParticipants(id);
  const invitationQuery = useInvitation(id);
  const isHost = invitationQuery.data?.myRole === 'HOST';

  const setCoHost = useSetCoHost(id);
  const transferHost = useTransferHost(id);
  const leaveInvitation = useLeaveInvitation(id);
  const updateHostMemo = useUpdateHostMemo(id);

  const [filterIndex, setFilterIndex] = useState(0);

  const memoSheetRef = useRef<BottomSheetRef>(null);
  const [memoTarget, setMemoTarget] = useState<Entry | null>(null);
  const [memoText, setMemoText] = useState('');

  const onMutationError = (err: unknown) => {
    haptics.error();
    Alert.alert('알림', messageForError(err));
  };
  const onMutationSuccess = () => haptics.success();

  function openMemo(entry: Entry) {
    setMemoTarget(entry);
    setMemoText(entry.participant.hostMemo ?? '');
    memoSheetRef.current?.present();
  }

  function saveMemo() {
    if (!memoTarget) return;
    const trimmed = memoText.trim();
    updateHostMemo.mutate(
      { participantId: memoTarget.participant.id, memo: trimmed.length > 0 ? trimmed : null },
      {
        onSuccess: () => {
          onMutationSuccess();
          memoSheetRef.current?.dismiss();
          setMemoTarget(null);
        },
        onError: onMutationError,
      },
    );
  }

  function confirmTransfer(entry: Entry) {
    const name = entry.user.nickname ?? entry.user.name ?? '이 참가자';
    showActionSheet({
      title: '호스트 위임',
      message: `${name}님에게 호스트를 위임할까요? 위임 후 되돌릴 수 없어요.`,
      options: [
        {
          label: '위임하기',
          destructive: true,
          onPress: () =>
            transferHost.mutate(entry.participant.id, {
              onSuccess: onMutationSuccess,
              onError: onMutationError,
            }),
        },
      ],
    });
  }

  function confirmRemove(entry: Entry) {
    const name = entry.user.nickname ?? entry.user.name ?? '이 참가자';
    showActionSheet({
      title: '참가자 제거',
      message: `${name}님을 모임에서 제거할까요?`,
      options: [
        {
          label: '제거하기',
          destructive: true,
          onPress: () =>
            leaveInvitation.mutate(
              { participantId: entry.participant.id },
              { onSuccess: onMutationSuccess, onError: onMutationError },
            ),
        },
      ],
    });
  }

  function openHostActions(entry: Entry) {
    const name = entry.user.nickname ?? entry.user.name ?? '참가자';
    showActionSheet({
      title: name,
      options: [
        {
          label: '공동 호스트 지정',
          onPress: () =>
            setCoHost.mutate(
              { participantId: entry.participant.id, isCoHost: true },
              { onSuccess: onMutationSuccess, onError: onMutationError },
            ),
        },
        {
          label: '공동 호스트 해제',
          onPress: () =>
            setCoHost.mutate(
              { participantId: entry.participant.id, isCoHost: false },
              { onSuccess: onMutationSuccess, onError: onMutationError },
            ),
        },
        { label: '호스트 위임', onPress: () => confirmTransfer(entry) },
        { label: '호스트 메모 편집', onPress: () => openMemo(entry) },
        { label: '참가자 제거', destructive: true, onPress: () => confirmRemove(entry) },
      ],
    });
  }

  const screenHeader = <Stack.Screen options={{ title: '참가자', headerLargeTitle: true }} />;

  if (participantsQuery.isPending) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (participantsQuery.error) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(participantsQuery.error)}</Text>
        <Button title="다시 시도" onPress={() => participantsQuery.refetch()} />
      </View>
    );
  }

  const { summary, participants } = participantsQuery.data;
  const segmentLabels = [
    `전체 ${summary.totalCount}`,
    `참석 ${summary.attendingCount}`,
    `미정 ${summary.undecidedCount}`,
    `불참 ${summary.absentCount}`,
  ];

  const activeFilter = FILTERS[filterIndex];
  const visible =
    activeFilter === 'all'
      ? participants
      : participants.filter((e) => e.participant.rsvpStatus === activeFilter);

  return (
    <>
      {screenHeader}
      <Screen
        background="grouped"
        scroll
        refreshControl={
          <RefreshControl
            refreshing={participantsQuery.isRefetching}
            onRefresh={() => participantsQuery.refetch()}
          />
        }>
        <View style={styles.segmentWrap}>
          <SegmentedControl
            values={segmentLabels}
            selectedIndex={filterIndex}
            onChange={setFilterIndex}
          />
        </View>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>해당하는 참가자가 없어요</Text>
          </View>
        ) : (
          <ListSection>
            {visible.map((entry) => (
              <RowItem
                key={entry.participant.id}
                entry={entry}
                isHost={isHost}
                onHostAction={openHostActions}
              />
            ))}
          </ListSection>
        )}
      </Screen>

      <BottomSheet ref={memoSheetRef}>
        <Text style={styles.sheetTitle}>호스트 메모</Text>
        <TextInput
          style={styles.memoInput}
          value={memoText}
          onChangeText={setMemoText}
          placeholder="이 참가자에 대한 메모 (나만 보임)"
          placeholderTextColor={ios.placeholderText}
          multiline
        />
        <Button title="저장" onPress={saveMemo} loading={updateHostMemo.isPending} />
      </BottomSheet>
    </>
  );
}

/** ListSection이 isLast를 주입 — 마지막 행 구분선 생략. 호스트면 탭 시 액션 시트. */
function RowItem({
  entry,
  isHost,
  onHostAction,
  isLast = false,
}: {
  entry: Entry;
  isHost: boolean;
  onHostAction: (entry: Entry) => void;
  isLast?: boolean;
}) {
  const eligible = isHost && entry.participant.memberRole !== 'HOST';
  return (
    <View>
      {eligible ? (
        <Pressable onPress={() => onHostAction(entry)} accessibilityRole="button">
          <ParticipantRow user={entry.user} participant={entry.participant} />
        </Pressable>
      ) : (
        <ParticipantRow user={entry.user} participant={entry.participant} />
      )}
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
  segmentWrap: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingTop: iosMetrics.spacing[3],
  },
  empty: { alignItems: 'center', paddingVertical: iosMetrics.spacing[16] },
  emptyText: { ...iosType.subhead, color: ios.secondaryLabel },
  separator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: 40 + iosMetrics.spacing[3] + iosMetrics.spacing[4],
  },
  sheetTitle: {
    ...iosType.headline,
    color: ios.label,
    marginBottom: iosMetrics.spacing[3],
    marginTop: iosMetrics.spacing[2],
  },
  memoInput: {
    ...iosType.body,
    color: ios.label,
    minHeight: 88,
    borderRadius: iosMetrics.radius.md,
    backgroundColor: ios.tertiarySystemFill,
    padding: iosMetrics.spacing[3],
    marginBottom: iosMetrics.spacing[4],
    textAlignVertical: 'top',
  },
});
