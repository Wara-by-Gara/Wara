/**
 * 참가자 목록 행 — 아바타·이름·역할 태그·호스트 메모·RSVP 배지.
 * 앱 크롬 컴포넌트이므로 색상/메트릭은 theme 토큰만 사용.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import type { Participant, ParticipantUser } from '@/api';
import { RsvpBadge } from './RsvpBadge';

const AVATAR_SIZE = 40;

export function ParticipantRow({
  user,
  participant,
}: {
  user: Pick<ParticipantUser, 'name' | 'nickname' | 'profileImageUrl'>;
  participant: Participant;
}) {
  const displayName = user.nickname ?? user.name ?? '이름 없음';
  const isHost = participant.memberRole === 'HOST';

  return (
    <View style={styles.row}>
      {user.profileImageUrl ? (
        <Image
          source={{ uri: user.profileImageUrl }}
          style={styles.avatar}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <IconSymbol name="person.fill" size={20} color={ios.systemGray} />
        </View>
      )}

      <View style={styles.textWrap}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {isHost ? (
            <View style={styles.hostTag}>
              <Text style={styles.hostTagText}>호스트</Text>
            </View>
          ) : null}
        </View>
        {participant.hostMemo ? (
          <Text style={styles.memo} numberOfLines={1}>
            {participant.hostMemo}
          </Text>
        ) : null}
      </View>

      <RsvpBadge status={participant.rsvpStatus} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    minHeight: iosMetrics.rowMinHeight,
    paddingVertical: iosMetrics.spacing[2],
    paddingHorizontal: iosMetrics.spacing[4],
    backgroundColor: ios.secondarySystemGroupedBackground,
  },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: iosMetrics.radius.full },
  avatarFallback: {
    backgroundColor: ios.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[2] },
  name: { ...iosType.body, color: ios.label, flexShrink: 1 },
  hostTag: {
    paddingVertical: 1,
    paddingHorizontal: iosMetrics.spacing[2],
    borderRadius: iosMetrics.radius.full,
    backgroundColor: ios.tertiarySystemFill,
  },
  hostTagText: { ...iosType.caption1, fontWeight: '600', color: ios.secondaryLabel },
  memo: { ...iosType.footnote, color: ios.secondaryLabel },
});
