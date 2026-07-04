/**
 * 초대장 상세의 내 RSVP 컨트롤.
 * 게스트는 참여/미정/불참 3개 pill로 응답, 호스트·마감은 안내만 표시.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WaraApiError, type Invitation, type RsvpStatus } from '@/api';
import { haptics } from '@/components/ios';
import { useJoinInvitation, useMyParticipant, useUpdateRsvp } from '@/hooks/queries/participants';
import { ios, iosMetrics, iosType } from '@/theme';

type Props = { invitation: Invitation };

type Option = { status: RsvpStatus; emoji: string; label: string };

const ERROR_MESSAGES: Record<string, string> = {
  INVITATION_CLOSED: '마감된 초대장이에요',
  VOTE_POLL_CLOSED: '마감된 초대장이에요',
  RSVP_PERMISSION_DENIED: '변경 권한이 없어요',
  PARTICIPANT_ALREADY_EXISTS: '이미 참여 중이에요',
};

function describeError(error: unknown): string {
  if (error instanceof WaraApiError) {
    return ERROR_MESSAGES[error.code] ?? '문제가 발생했어요';
  }
  return '문제가 발생했어요';
}

export function RsvpControl({ invitation }: Props) {
  const myParticipant = useMyParticipant(invitation.id);
  const join = useJoinInvitation(invitation.id);
  const updateRsvp = useUpdateRsvp(invitation.id);
  const [pending, setPending] = useState<RsvpStatus | null>(null);

  if (invitation.myRole === 'HOST') {
    return <Notice text="호스트는 참석 대상이 아니에요" />;
  }

  const isClosed = invitation.status === 'closed';
  const isMutating = join.isPending || updateRsvp.isPending;
  const errorMessage = join.error
    ? describeError(join.error)
    : updateRsvp.error
      ? describeError(updateRsvp.error)
      : null;

  const options: Option[] = [
    { status: 'attending', emoji: invitation.rsvpAttendingEmoji, label: invitation.rsvpAttendingLabel },
    { status: 'undecided', emoji: invitation.rsvpMaybeEmoji, label: invitation.rsvpMaybeLabel },
    { status: 'absent', emoji: invitation.rsvpDeclinedEmoji, label: invitation.rsvpDeclinedLabel },
  ];

  const handleSelect = (status: RsvpStatus) => {
    if (isClosed || isMutating) return;
    if (status === invitation.myRsvpStatus) return;
    setPending(status);
    const onSuccess = () => haptics.success();
    const onSettled = () => setPending(null);
    const existing = myParticipant.data;
    if (existing) {
      updateRsvp.mutate({ participantId: existing.id, rsvpStatus: status }, { onSuccess, onSettled });
    } else {
      join.mutate({ rsvpStatus: status }, { onSuccess, onSettled });
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>내 참석 여부</Text>
      <View style={styles.pillRow}>
        {options.map((opt) => {
          const selected = invitation.myRsvpStatus === opt.status;
          const busy = pending === opt.status;
          return (
            <Pressable
              key={opt.status}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: isClosed || isMutating }}
              disabled={isClosed || isMutating}
              onPress={() => handleSelect(opt.status)}
              style={({ pressed }) => [
                styles.pill,
                selected ? styles.pillSelected : styles.pillIdle,
                pressed && !isClosed && styles.pillPressed,
                (isClosed || (isMutating && !busy)) && styles.pillDisabled,
              ]}>
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={[styles.pillLabel, selected ? styles.pillLabelSelected : styles.pillLabelIdle]} numberOfLines={1}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {isClosed ? <Text style={styles.footnote}>마감됨</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.notice}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: iosMetrics.spacing[3] },
  heading: { ...iosType.headline, color: ios.label },
  pillRow: { flexDirection: 'row', gap: iosMetrics.spacing[2] },
  pill: {
    flex: 1,
    minHeight: 64,
    borderRadius: iosMetrics.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[1],
    paddingHorizontal: iosMetrics.spacing[2],
  },
  pillIdle: { backgroundColor: ios.tertiarySystemFill },
  pillSelected: { backgroundColor: ios.tint },
  pillPressed: { opacity: 0.6 },
  pillDisabled: { opacity: 0.4 },
  emoji: { fontSize: 22 },
  pillLabel: { ...iosType.subhead, fontWeight: '600' },
  pillLabelIdle: { color: ios.label },
  pillLabelSelected: { color: '#FFFFFF' },
  footnote: { ...iosType.footnote, color: ios.secondaryLabel },
  errorText: { ...iosType.footnote, color: ios.systemRed },
  notice: { ...iosType.subhead, color: ios.secondaryLabel },
});
