/**
 * 초대장 상세의 내 RSVP 컨트롤 — 웹 RsvpSection + RSVPButtonGroup 미러.
 * frosted 원형 버튼 3개(이모지 크게 + 라벨), 선택 시 확대·나머지 흐림(Reanimated).
 * 게스트는 응답 선택, 호스트는 참석 고정 읽기전용, 마감 시 전체 비활성.
 * frost/보더/텍스트는 초대장 캔버스 요소라 hex 사용.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { WaraApiError, type Invitation, type RsvpStatus } from '@/api';
import { Glass, haptics } from '@/components/ios';
import { useJoinInvitation, useMyParticipant, useUpdateRsvp } from '@/hooks/queries/participants';
import { ios, iosMetrics, iosType } from '@/theme';

type Props = { invitation: Invitation; onDark?: boolean };

type CircleState = 'default' | 'selected' | 'dimmed';

const ORDER: RsvpStatus[] = ['attending', 'undecided', 'absent'];

/** 호스트 커스텀 이모지/라벨 미지정 시 기본값 (웹 RSVPButtonGroup DEFAULTS 미러). */
const DEFAULTS: Record<RsvpStatus, { emoji: string; label: string }> = {
  attending: { emoji: '❤️', label: '참석' },
  undecided: { emoji: '❤️‍🩹', label: '미정' },
  absent: { emoji: '💔', label: '불참' },
};

const CIRCLE_GAP = 16;
const CIRCLE_MAX = 104;

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

export function RsvpControl({ invitation, onDark }: Props) {
  const myParticipant = useMyParticipant(invitation.id);
  const join = useJoinInvitation(invitation.id);
  const updateRsvp = useUpdateRsvp(invitation.id);
  const [pending, setPending] = useState<RsvpStatus | null>(null);
  const { width } = useWindowDimensions();

  const isHost = invitation.myRole === 'HOST';
  const isClosed = invitation.status === 'closed';
  const isMutating = join.isPending || updateRsvp.isPending;
  const disabled = isHost || isClosed || isMutating;

  // 호스트는 항상 참석으로 표시 (웹 HostView 미러)
  const value: RsvpStatus | null = isHost
    ? 'attending'
    : (pending ?? invitation.myRsvpStatus ?? null);

  const errorMessage = join.error
    ? describeError(join.error)
    : updateRsvp.error
      ? describeError(updateRsvp.error)
      : null;

  const helperText = isHost
    ? '호스트는 참석으로 표시돼요'
    : isClosed
      ? '호스트가 참석 응답을 마감했어요'
      : null;

  const circleSize = Math.min(
    CIRCLE_MAX,
    Math.floor((width - iosMetrics.pagePadding * 2 - CIRCLE_GAP * 2) / 3),
  );

  const resolve = (status: RsvpStatus) => {
    const custom = {
      attending: { emoji: invitation.rsvpAttendingEmoji, label: invitation.rsvpAttendingLabel },
      undecided: { emoji: invitation.rsvpMaybeEmoji, label: invitation.rsvpMaybeLabel },
      absent: { emoji: invitation.rsvpDeclinedEmoji, label: invitation.rsvpDeclinedLabel },
    }[status];
    return {
      emoji: custom.emoji || DEFAULTS[status].emoji,
      label: custom.label || DEFAULTS[status].label,
    };
  };

  const handleSelect = (status: RsvpStatus) => {
    if (disabled) return;
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
    <View>
      <Text style={[styles.heading, onDark && styles.headingOnDark]}>참석 여부</Text>
      <Text style={[styles.subtitle, onDark && styles.subtitleOnDark]}>
        원하는 응답을 선택해주세요
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="참석 여부"
        style={[styles.circleRow, (isClosed || isMutating) && styles.rowDisabled]}>
        {ORDER.map((status) => {
          const opt = resolve(status);
          const state: CircleState =
            value == null ? 'default' : value === status ? 'selected' : 'dimmed';
          return (
            <RsvpCircle
              key={status}
              size={circleSize}
              emoji={opt.emoji}
              label={opt.label}
              state={state}
              disabled={disabled}
              onPress={() => handleSelect(status)}
            />
          );
        })}
      </View>
      {helperText ? (
        <Text style={[styles.helper, onDark && styles.helperOnDark]}>{helperText}</Text>
      ) : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

function RsvpCircle({
  size,
  emoji,
  label,
  state,
  disabled,
  onPress,
}: {
  size: number;
  emoji: string;
  label: string;
  state: CircleState;
  disabled: boolean;
  onPress: () => void;
}) {
  // 선택 확대·나머지 흐림 (웹 selected/dimmed variant 미러)
  const containerStyle = useAnimatedStyle(() => {
    const scale = state === 'selected' ? 1.06 : state === 'dimmed' ? 0.95 : 1;
    return {
      opacity: withTiming(state === 'dimmed' ? 0.45 : 1, { duration: 200 }),
      transform: [{ scale: withTiming(scale, { duration: 200 }) }],
    };
  }, [state]);

  // 선택 시 frost 진해짐 (웹 radial frost 강화 근사)
  const frostStyle = useAnimatedStyle(
    () => ({ opacity: withTiming(state === 'selected' ? 0.88 : 0.4, { duration: 200 }) }),
    [state],
  );

  return (
    <Animated.View style={[styles.circleShadow, { width: size, height: size }, containerStyle]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={label}
        accessibilityState={{ checked: state === 'selected', disabled }}
        disabled={disabled}
        onPress={onPress}
        style={styles.circlePress}>
        <Glass glassStyle="clear" style={[styles.circle, { borderRadius: size / 2 }]}>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.frost, frostStyle]} />
          <Text style={styles.emoji} numberOfLines={1}>
            {emoji}
          </Text>
          <Text
            style={[styles.label, state === 'selected' && styles.labelSelected]}
            numberOfLines={1}>
            {label}
          </Text>
        </Glass>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', color: ios.label },
  headingOnDark: { color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: ios.secondaryLabel, marginTop: 2 },
  subtitleOnDark: { color: 'rgba(255,255,255,0.7)' },
  circleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: CIRCLE_GAP,
    marginTop: iosMetrics.spacing[3],
  },
  rowDisabled: { opacity: 0.5 },
  circleShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  circlePress: { flex: 1 },
  circle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  frost: { backgroundColor: '#FFFFFF' },
  emoji: { fontSize: 30 },
  label: { fontSize: 13, fontWeight: '500', color: 'rgba(17,17,17,0.85)' },
  labelSelected: { fontWeight: '700', color: '#111111' },
  helper: {
    ...iosType.footnote,
    textAlign: 'center',
    color: ios.secondaryLabel,
    marginTop: iosMetrics.spacing[3],
  },
  helperOnDark: { color: 'rgba(255,255,255,0.85)' },
  errorText: {
    ...iosType.footnote,
    textAlign: 'center',
    color: ios.systemRed,
    marginTop: iosMetrics.spacing[2],
  },
});
