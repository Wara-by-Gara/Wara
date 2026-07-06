/**
 * 참석자 아바타 가로 스크롤 행 — 웹 InvitationDetail ParticipantAvatarRow 미러.
 * 참석(attending)만 노출·호스트 우선, 인디케이터 숨김, 호스트 우하단 왕관 뱃지.
 * 이미지 없으면 이름 해시 → 그라데이션 모노그램 원.
 * 초대장 캔버스 요소라 그라데이션/뱃지에 hex 사용.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Participant, ParticipantUser } from '@/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics } from '@/theme';

type Entry = { participant: Participant; user: ParticipantUser };

export type ParticipantAvatarRowProps = {
  participants: Entry[];
  onPressParticipant?: (entry: Entry) => void;
  /** 전체 목록 보기 (지정 시 행 끝에 진입 버튼 노출). */
  onPressAll?: () => void;
  /** 어두운 캔버스 배경 위 렌더링 시 대비 전환. */
  onDark?: boolean;
};

const AVATAR_SIZE = 48;

/** 아바타 그라데이션 팔레트 — packages/tokens/src/avatarGradients.ts 미러 (모바일은 tokens 미의존). */
const AVATAR_GRADIENTS: { from: string; to: string; fg: string }[] = [
  { from: '#FF8A4C', to: '#FF3D77', fg: '#FFFFFF' }, // orange→pink
  { from: '#8B5CF6', to: '#5B9DFF', fg: '#FFFFFF' }, // purple→blue
  { from: '#5B9DFF', to: '#FF6FA3', fg: '#FFFFFF' }, // blue→pink
  { from: '#34D399', to: '#3BC4F2', fg: '#0B2B26' }, // green→cyan
  { from: '#FBBF24', to: '#FF7A45', fg: '#3A2400' }, // amber→orange
  { from: '#22D3EE', to: '#6D5BFF', fg: '#FFFFFF' }, // cyan→indigo
  { from: '#F472B6', to: '#A78BFA', fg: '#FFFFFF' }, // pink→lavender
  { from: '#7DE2B8', to: '#5B9DFF', fg: '#06251C' }, // mint→blue
  { from: '#FF6FA3', to: '#FFB14D', fg: '#3A1020' }, // pink→amber
  { from: '#A78BFA', to: '#22D3EE', fg: '#160A2E' }, // lavender→cyan
];

/** 문자열을 안정적으로 팔레트 인덱스로 매핑 (tokens avatarGradientIndex 동일 해시). */
function pickGradient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length] ?? AVATAR_GRADIENTS[0]!;
}

export function ParticipantAvatarRow({
  participants,
  onPressParticipant,
  onPressAll,
  onDark,
}: ParticipantAvatarRowProps) {
  const sorted = participants
    .filter((entry) => entry.participant.rsvpStatus === 'attending')
    .sort((a, b) => {
      if (a.participant.memberRole === 'HOST') return -1;
      if (b.participant.memberRole === 'HOST') return 1;
      return 0;
    });

  if (sorted.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {sorted.map((entry) => {
        const { participant, user } = entry;
        const isHost = participant.memberRole === 'HOST';
        const name = user.name ?? user.nickname ?? null;
        return (
          <Pressable
            key={participant.id}
            accessibilityRole="button"
            accessibilityLabel={name ?? '참석자'}
            disabled={!onPressParticipant}
            onPress={onPressParticipant ? () => onPressParticipant(entry) : undefined}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
            <AvatarCircle name={name} imageUrl={user.profileImageUrl} seed={name ?? participant.userId} />
            {isHost ? (
              <View style={[styles.crownBadge, onDark && styles.crownBadgeOnDark]}>
                <IconSymbol name="crown.fill" size={9} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
      {onPressAll ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="참석자 전체 보기"
          onPress={onPressAll}
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
          <View style={[styles.allButton, onDark && styles.allButtonOnDark]}>
            <IconSymbol
              name="chevron.right"
              size={15}
              color={onDark ? '#FFFFFF' : ios.secondaryLabel}
            />
          </View>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function AvatarCircle({
  name,
  imageUrl,
  seed,
}: {
  name: string | null;
  imageUrl: string | null;
  seed: string;
}) {
  // 시드 데이터의 'dicebear:...' 플레이스홀더 등 http(s)가 아닌 값은 이미지가 아님 —
  // 웹은 @dicebear로 로컬 생성하지만 모바일은 그라데이션 모노그램으로 폴백한다.
  if (imageUrl && /^https?:/.test(imageUrl)) {
    return (
      <Image source={{ uri: imageUrl }} style={styles.avatar} contentFit="cover" transition={150} />
    );
  }
  const gradient = pickGradient(seed);
  const initial = name?.trim().charAt(0).toUpperCase() ?? '';
  return (
    <LinearGradient
      colors={[gradient.from, gradient.to] as const}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.avatar, styles.gradient]}>
      {initial ? (
        <Text style={[styles.initial, { color: gradient.fg }]}>{initial}</Text>
      ) : (
        <IconSymbol name="person.fill" size={20} color={gradient.fg} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[2],
    paddingVertical: iosMetrics.spacing[1],
  },
  item: { position: 'relative' },
  itemPressed: { transform: [{ scale: 0.95 }] },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  gradient: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 18, fontWeight: '700' },
  crownBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  crownBadgeOnDark: { borderColor: 'rgba(0,0,0,0.45)' },
  allButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ios.tertiarySystemFill,
  },
  allButtonOnDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
});
