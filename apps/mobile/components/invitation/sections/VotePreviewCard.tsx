/**
 * 초대장 상세 — 일정 투표 미리보기 카드.
 * 웹 InvitationDetail/Container/VotePreviewCard 미러: 진행 중(open/closed)인 date 폴이 있을 때
 * 상태·후보 수·현재 1위(동률 포함)를 요약하고, 탭하면 투표 화면으로 이동.
 * 폴이 없거나 확정(confirmed)이면 렌더하지 않는다.
 */

import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DateVoteSlot } from '@/api/dateVote';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePolls, useResults } from '@/hooks/queries/dateVote';
import { ios, iosMetrics, iosType } from '@/theme';

type Props = {
  invitationId: string;
  /** 어두운 초대장 캔버스 위 렌더 (캔버스 경계 — hex 허용). */
  onDark?: boolean;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 'YYYY-MM-DD' (+ 'HH:MM') → '7월 5일 (토) 15:00'. custom 슬롯은 label. */
function formatSlot(slot: DateVoteSlot): string {
  if (!slot.date) return slot.label ?? '후보';
  const parsed = new Date(`${slot.date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return slot.date;
  const base = `${parsed.getMonth() + 1}월 ${parsed.getDate()}일 (${WEEKDAYS[parsed.getDay()]})`;
  return slot.startTime ? `${base} ${slot.startTime}` : base;
}

export function VotePreviewCard({ invitationId, onDark = false }: Props) {
  const router = useRouter();

  const pollsQuery = usePolls(invitationId);
  // 모바일은 날짜 투표만 다룬다 — 첫 date 폴을 활성 폴로 사용 (vote 화면과 동일 규칙).
  const activePoll = useMemo(
    () => pollsQuery.data?.polls.find((p) => p.poll.voteType === 'date') ?? null,
    [pollsQuery.data],
  );
  const poll = activePoll?.poll ?? null;
  const showCard = !!poll && poll.status !== 'confirmed';

  const resultsQuery = useResults(showCard ? invitationId : '', poll?.id);

  // 동률 포함 최다 득표 슬롯 — 웹 topLabel 로직 미러.
  const topLabel = useMemo(() => {
    const ranked = (resultsQuery.data?.slotResults ?? [])
      .filter((sr) => sr.counts.good > 0)
      .sort((a, b) => b.counts.good - a.counts.good);
    const maxGood = ranked[0]?.counts.good ?? 0;
    if (maxGood === 0) return null;
    const top = ranked.filter((sr) => sr.counts.good === maxGood);
    const sole = top.length === 1 ? top[0] : undefined;
    if (sole) return `현재 1위: ${formatSlot(sole.slot)} (${maxGood}표)`;
    return `${top.length}개 동률 (${maxGood}표)`;
  }, [resultsQuery.data]);

  if (!showCard || !poll) return null;

  const slotCount = activePoll?.slots.length ?? 0;
  const parts = [poll.status === 'closed' ? '마감됨' : '진행 중'];
  if (slotCount > 0) parts.push(`후보 ${slotCount}개`);
  if (topLabel) parts.push(topLabel);
  const subtitle = parts.join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`일정 투표 — ${subtitle}`}
      onPress={() => router.push(`/invitations/${invitationId}/vote`)}
      style={({ pressed }) => [
        styles.card,
        onDark ? styles.cardDark : styles.cardLight,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, onDark ? styles.iconWrapDark : styles.iconWrapLight]}>
        <IconSymbol name="calendar" size={20} color={onDark ? DARK_LABEL : ios.tint} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, onDark ? styles.titleDark : styles.titleLight]}>일정 투표</Text>
        <Text
          style={[styles.subtitle, onDark ? styles.mutedDark : styles.mutedLight]}
          numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={14} color={onDark ? DARK_MUTED : ios.tertiaryLabel} />
    </Pressable>
  );
}

// 캔버스(onDark) 경계 전용 hex — 앱 크롬에는 사용 금지.
const DARK_LABEL = '#FFFFFF';
const DARK_MUTED = 'rgba(255,255,255,0.72)';
const DARK_CARD = 'rgba(255,255,255,0.12)';
const DARK_ICON_BG = 'rgba(255,255,255,0.16)';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    borderRadius: iosMetrics.radius.lg,
    padding: iosMetrics.spacing[4],
  },
  cardLight: { backgroundColor: ios.secondarySystemGroupedBackground },
  cardDark: { backgroundColor: DARK_CARD },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: iosMetrics.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapLight: { backgroundColor: ios.tertiarySystemFill },
  iconWrapDark: { backgroundColor: DARK_ICON_BG },
  textWrap: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...iosType.subhead, fontWeight: '700' },
  titleLight: { color: ios.label },
  titleDark: { color: DARK_LABEL },
  subtitle: { ...iosType.footnote },
  mutedLight: { color: ios.secondaryLabel },
  mutedDark: { color: DARK_MUTED },
});
