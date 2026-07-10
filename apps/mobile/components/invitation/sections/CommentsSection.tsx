/**
 * 초대장 상세 인라인 댓글 섹션 — 웹 PhotoWithFeedback/InvitationFeedbacks 미러(축약).
 * 헤더("댓글" + "N개의 댓글" + "댓글 쓰기" pill), 최신 댓글 미리보기(아바타·이름·
 * 상대시간·본문·첨부이미지/GIF·좋아요 하트+수·대댓글), 전체보기 → comments 화면 push.
 *
 * onDark: 초대장 캔버스(어두운 배경) 위 배치용 — 캔버스 경계라 hex/rgba 허용.
 */

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ColorValue,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { haptics } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import type { Feedback } from '@/api/feedbacks';
import { useInvitationFeedbacks, useToggleFeedbackLike } from '@/hooks/queries/feedbacks';

/** 미리보기 최대 개수 (요구: 최신 3~5개). */
const PREVIEW_LIMIT = 4;

interface Props {
  invitationId: string;
  /** 어두운 초대장 캔버스 위 배치 여부 — 텍스트를 흰색 계열로 전환. */
  onDark?: boolean;
}

/** 웹 getCommentAuthorName 미러 — 탈퇴 회원 마스킹. */
function authorName(user: Feedback['participant']['user']): string {
  if (user.isWithdrawn) return '탈퇴한 회원';
  return user.name?.trim() || '이름 없음';
}

/** 상대 시간 표기 (방금 / n분 전 / n시간 전 / n일 전 / 날짜). */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return '방금';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

/** onDark(캔버스 hex) / 라이트(PlatformColor 토큰) 겸용 색상 세트. */
type Palette = Record<'title' | 'subtitle' | 'body' | 'muted' | 'pillBg' | 'pillText', ColorValue>;

export function CommentsSection({ invitationId, onDark }: Props) {
  const router = useRouter();
  const feedbacksQuery = useInvitationFeedbacks(invitationId);
  const toggleLike = useToggleFeedbackLike(invitationId);

  const rows = feedbacksQuery.data?.pages.flatMap((page) => page.rows) ?? [];
  const total = feedbacksQuery.data?.pages[0]?.total ?? rows.length;
  const preview = rows.slice(0, PREVIEW_LIMIT);

  const openComments = () => router.push(`/invitations/${invitationId}/comments`);

  const onLike = (feedbackId: string) => {
    haptics.light();
    toggleLike.mutate(feedbackId);
  };

  const c: Palette = onDark
    ? {
        title: '#FFFFFF',
        subtitle: 'rgba(255,255,255,0.7)',
        body: '#FFFFFF',
        muted: 'rgba(255,255,255,0.6)',
        pillBg: 'rgba(255,255,255,0.15)',
        pillText: '#FFFFFF',
      }
    : {
        title: ios.label,
        subtitle: ios.secondaryLabel,
        body: ios.label,
        muted: ios.tertiaryLabel,
        pillBg: ios.tint,
        pillText: '#FFFFFF',
      };

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.title }]}>댓글</Text>
          <Text style={[styles.subtitle, { color: c.subtitle }]}>{total}개의 댓글</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="댓글 쓰기"
          hitSlop={6}
          onPress={openComments}
          style={({ pressed }) => [styles.pill, { backgroundColor: c.pillBg }, pressed && styles.pressed]}>
          <Text style={[styles.pillText, { color: c.pillText }]}>댓글 쓰기</Text>
        </Pressable>
      </View>

      {feedbacksQuery.isPending ? (
        <ActivityIndicator style={styles.stateBlock} />
      ) : feedbacksQuery.error ? (
        <Text style={[styles.stateText, { color: c.muted }]}>댓글을 불러오지 못했어요</Text>
      ) : preview.length === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="첫 댓글 남기기"
          onPress={openComments}
          style={({ pressed }) => [styles.empty, pressed && styles.pressed]}>
          <Text style={[styles.stateText, { color: c.muted }]}>
            아직 댓글이 없어요. 첫 댓글을 남겨보세요
          </Text>
        </Pressable>
      ) : (
        <View style={styles.list}>
          {preview.map((feedback) => (
            <View key={feedback.id} style={styles.thread}>
              <CommentPreviewRow feedback={feedback} palette={c} onLike={onLike} />
              {feedback.replies.map((reply) => (
                <View key={reply.id} style={styles.replyIndent}>
                  <CommentPreviewRow feedback={reply} palette={c} onLike={onLike} />
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {total > preview.length ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="댓글 전체 보기"
          onPress={openComments}
          style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
          <Text style={[styles.moreText, { color: onDark ? '#FFFFFF' : ios.tint }]}>
            댓글 {total}개 모두 보기
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CommentPreviewRow({
  feedback,
  palette,
  onLike,
}: {
  feedback: Feedback;
  palette: Palette;
  onLike: (feedbackId: string) => void;
}) {
  if (feedback.deletedAt) {
    return (
      <View style={styles.row}>
        <View style={[styles.avatar, styles.avatarFallback]}>
          <IconSymbol name="person.fill" size={14} color={palette.muted} />
        </View>
        <Text style={[styles.deletedText, { color: palette.muted }]}>삭제된 댓글입니다</Text>
      </View>
    );
  }

  const user = feedback.participant.user;
  const name = authorName(user);
  const attachedUrl = feedback.attachedPhoto?.url ?? feedback.gifUrl ?? null;
  const liked = feedback.likedByMe ?? false;

  return (
    <View style={styles.row}>
      {user.profileImageUrl ? (
        <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={[styles.avatarInitial, { color: palette.subtitle }]}>{name.slice(0, 1)}</Text>
        </View>
      )}
      <View style={styles.rowBody}>
        <View style={styles.metaRow}>
          <Text style={[styles.name, { color: palette.body }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.time, { color: palette.muted }]}>
            {relativeTime(feedback.createdAt)}
          </Text>
        </View>
        {feedback.content ? (
          <Text style={[styles.content, { color: palette.body }]} numberOfLines={3}>
            {feedback.content}
          </Text>
        ) : null}
        {attachedUrl ? (
          <Image
            source={{ uri: attachedUrl }}
            style={styles.attachedImage}
            contentFit="cover"
            transition={150}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
          hitSlop={6}
          onPress={() => onLike(feedback.id)}
          style={({ pressed }) => [styles.likeButton, pressed && styles.pressed]}>
          <IconSymbol
            name={liked ? 'heart.fill' : 'heart'}
            size={13}
            color={liked ? '#FF453A' : palette.muted}
          />
          {feedback.likeCount > 0 ? (
            <Text style={[styles.likeCount, { color: palette.muted }]}>{feedback.likeCount}</Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: iosMetrics.spacing[3],
    marginBottom: iosMetrics.spacing[2],
  },
  headerText: { flexShrink: 1, gap: 2 },
  title: { ...iosType.headline, fontWeight: '700' },
  subtitle: { ...iosType.caption1 },
  pill: {
    paddingHorizontal: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[1],
    borderRadius: iosMetrics.radius.full,
  },
  pillText: { ...iosType.subhead, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  stateBlock: { paddingVertical: iosMetrics.spacing[6] },
  stateText: { ...iosType.subhead, textAlign: 'center' },
  empty: { paddingVertical: iosMetrics.spacing[6] },
  list: { gap: iosMetrics.spacing[2] },
  thread: { gap: iosMetrics.spacing[1] },
  replyIndent: { paddingLeft: iosMetrics.spacing[8] },
  row: { flexDirection: 'row', gap: iosMetrics.spacing[3], paddingVertical: iosMetrics.spacing[1] },
  rowBody: { flex: 1, gap: 3 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // 아바타 placeholder — 라이트/다크 캔버스 공용 중립 회색(캔버스 경계 예외).
    backgroundColor: 'rgba(120,120,128,0.24)',
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...iosType.footnote, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: iosMetrics.spacing[2] },
  name: { ...iosType.subhead, fontWeight: '600', flexShrink: 1 },
  time: { ...iosType.caption1 },
  content: { ...iosType.subhead },
  attachedImage: {
    width: 160,
    aspectRatio: 1,
    borderRadius: iosMetrics.radius.md,
    backgroundColor: 'rgba(120,120,128,0.2)',
    marginTop: 2,
  },
  likeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  likeCount: { ...iosType.caption1, fontWeight: '600' },
  deletedText: { ...iosType.subhead, fontStyle: 'italic', alignSelf: 'center' },
  moreButton: { marginTop: iosMetrics.spacing[2], paddingVertical: iosMetrics.spacing[2] },
  moreText: { ...iosType.subhead, fontWeight: '600', textAlign: 'center' },
});
