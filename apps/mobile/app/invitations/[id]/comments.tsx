// 초대장 활동 피드 댓글 (F-DPZZXZ) — 웹 /invitations/[invitationId]/comments 미러.
// 목록(아바타·이름·시간·본문·첨부이미지·답글·좋아요) + 하단 텍스트 입력 +
// 본인 댓글 수정/삭제 + 사진 첨부(presigned 업로드 → attachedPhotoId).
// 웹과 동일하게 실시간 소켓 없이 작성/수정/삭제 후 invalidate로 갱신한다.
// (좋아요는 웹과 동일하게 낙관적 캐시 갱신 — useToggleFeedbackLike)

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { haptics, showActionSheet } from '@/components/ios';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError, fetchMe, userKeys } from '@/api';
import type { Feedback } from '@/api/feedbacks';
import {
  deletePhoto,
  getPhotoPresignedUrl,
  registerPhoto,
  type MobilePhoto,
} from '@/api/photos';
import { useImageUpload } from '@/hooks/useImageUpload';
import {
  useCreateInvitationFeedback,
  useDeleteInvitationFeedback,
  useInvitationFeedbacks,
  useToggleFeedbackLike,
  useUpdateInvitationFeedback,
} from '@/hooks/queries/feedbacks';

function messageForError(err: unknown): string {
  if (err instanceof WaraApiError) {
    switch (err.code) {
      case 'INVITATION_NOT_FOUND':
        return '초대장을 찾을 수 없어요';
      case 'INVITATION_ACCESS_REVOKED':
        return '이 초대장에 접근할 수 없어요';
      case 'PARTICIPANT_NOT_FOUND':
        return '모임 참가자만 댓글을 남길 수 있어요';
      case 'FEEDBACK_NOT_FOUND':
        return '댓글을 찾을 수 없어요';
      case 'FEEDBACK_FORBIDDEN':
        return '본인 댓글만 수정·삭제할 수 있어요';
    }
  }
  return '문제가 발생했어요';
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

type ReplyTarget = { id: string; authorName: string };

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const meQuery = useQuery({ queryKey: userKeys.me(), queryFn: ({ signal }) => fetchMe(signal) });
  const meId = meQuery.data?.id ?? '';

  const feedbacksQuery = useInvitationFeedbacks(id);
  const createMutation = useCreateInvitationFeedback(id);
  const updateMutation = useUpdateInvitationFeedback(id);
  const deleteMutation = useDeleteInvitationFeedback(id);
  const likeMutation = useToggleFeedbackLike(id);

  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  // 본인 댓글 수정 모드 — 하단 입력창을 재사용(웹 editingSlot 대응).
  const [editingId, setEditingId] = useState<string | null>(null);
  // 첨부 대기 사진 — 이미 앨범 등록(registerPhoto)까지 끝난 상태로 대기.
  const [pendingPhoto, setPendingPhoto] = useState<MobilePhoto | null>(null);

  // 사진 첨부: 웹 CommentInputBar 계약 미러 — presigned PUT → registerPhoto → attachedPhotoId.
  const upload = useImageUpload<MobilePhoto>({
    getPresignedUrl: (fileName, contentType) => getPhotoPresignedUrl(id, fileName, contentType),
    register: (meta) =>
      registerPhoto(id, meta.imageKey, {
        takenAt: meta.takenAt,
        fileSize: meta.fileSize,
        exifMetadata: meta.exifMetadata,
      }),
  });

  useEffect(() => {
    if (upload.error) {
      Alert.alert('사진 첨부', upload.error);
      upload.reset();
    }
  }, [upload.error, upload.reset]);

  const feedbacks = useMemo(
    () => feedbacksQuery.data?.pages.flatMap((p) => p.rows) ?? [],
    [feedbacksQuery.data],
  );
  const total = feedbacksQuery.data?.pages[0]?.total ?? feedbacks.length;
  const title = feedbacksQuery.data ? `댓글 ${total}` : '댓글';

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canSend =
    !isSubmitting &&
    !upload.uploading &&
    (editingId ? draft.trim().length > 0 : draft.trim().length > 0 || pendingPhoto !== null);

  async function onAttachPhoto() {
    if (upload.uploading || editingId) return;
    const [photo] = await upload.pickAndUpload({ allowsMultipleSelection: false });
    if (photo) setPendingPhoto(photo);
  }

  /** 첨부 취소 — 이미 앨범에 등록된 사진이므로 고아 사진이 남지 않게 삭제(soft delete). */
  function removePendingPhoto() {
    const photo = pendingPhoto;
    setPendingPhoto(null);
    if (photo) {
      deletePhoto(id, photo.id).catch(() => {
        // 삭제 실패는 치명적이지 않음(앨범에 남을 뿐) — 조용히 무시.
      });
    }
  }

  function startEdit(feedback: Feedback) {
    if (pendingPhoto) removePendingPhoto();
    setReplyingTo(null);
    setEditingId(feedback.id);
    setDraft(feedback.content ?? '');
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft('');
  }

  function handleSend() {
    if (!canSend) return;
    const content = draft.trim();

    if (editingId) {
      updateMutation.mutate(
        { feedbackId: editingId, content },
        {
          onSuccess: cancelEdit,
          onError: (err) => Alert.alert('댓글 수정', messageForError(err)),
        },
      );
      return;
    }

    createMutation.mutate(
      {
        ...(content && { content }),
        parentId: replyingTo?.id,
        attachedPhotoId: pendingPhoto?.id,
      },
      {
        onSuccess: () => {
          setDraft('');
          setReplyingTo(null);
          setPendingPhoto(null);
        },
        onError: (err) => Alert.alert('댓글 작성', messageForError(err)),
      },
    );
  }

  function onToggleLike(feedbackId: string) {
    haptics.light();
    likeMutation.mutate(feedbackId, {
      onError: (err) => Alert.alert('좋아요', messageForError(err)),
    });
  }

  // 웹 미러: 더보기 메뉴(수정/삭제) → 수정은 입력창 재사용, 삭제는 확인 다이얼로그.
  function onLongPressMine(feedback: Feedback) {
    showActionSheet({
      options: [
        // 사진/GIF 단독 댓글은 서버가 content 필수라 수정 대상에서 제외(웹과 동일하게 본문만 수정).
        ...(feedback.content
          ? [{ label: '수정', onPress: () => startEdit(feedback) }]
          : []),
        {
          label: '삭제',
          destructive: true,
          onPress: () =>
            Alert.alert('이 댓글을 삭제할까요?', undefined, [
              { text: '취소', style: 'cancel' },
              {
                text: '삭제',
                style: 'destructive',
                onPress: () =>
                  deleteMutation.mutate(feedback.id, {
                    onError: (err) => Alert.alert('댓글 삭제', messageForError(err)),
                  }),
              },
            ]),
        },
      ],
    });
  }

  if (feedbacksQuery.isPending) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (feedbacksQuery.error) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title }} />
        <Text style={styles.errorTitle}>댓글을 불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(feedbacksQuery.error)}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <Stack.Screen options={{ title }} />
      <FlatList
        style={styles.flex}
        data={feedbacks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="interactive"
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (feedbacksQuery.hasNextPage && !feedbacksQuery.isFetchingNextPage) {
            void feedbacksQuery.fetchNextPage();
          }
        }}
        ListFooterComponent={
          feedbacksQuery.isFetchingNextPage ? <ActivityIndicator style={styles.pageSpinner} /> : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>댓글이 아직 없어요</Text>
            <Text style={styles.emptyBody}>첫 댓글을 남겨보세요</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemBlock}>
            <CommentRow
              feedback={item}
              mine={!item.deletedAt && !!meId && item.participant.userId === meId}
              onLongPressMine={onLongPressMine}
              onLike={onToggleLike}
              onReply={() =>
                setReplyingTo({
                  id: item.id,
                  authorName: item.participant.user.nickname ?? authorName(item.participant.user),
                })
              }
            />
            {item.replies.map((reply) => (
              <View key={reply.id} style={styles.replyIndent}>
                <CommentRow
                  feedback={reply}
                  mine={!reply.deletedAt && !!meId && reply.participant.userId === meId}
                  onLongPressMine={onLongPressMine}
                  onLike={onToggleLike}
                />
              </View>
            ))}
          </View>
        )}
      />

      <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, iosMetrics.spacing[2]) }]}>
        {editingId ? (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText}>댓글 수정 중</Text>
            <Pressable onPress={cancelEdit} accessibilityRole="button" hitSlop={6}>
              <Text style={styles.replyBannerCancel}>취소</Text>
            </Pressable>
          </View>
        ) : replyingTo ? (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText}>@{replyingTo.authorName}에게 답글</Text>
            <Pressable onPress={() => setReplyingTo(null)} accessibilityRole="button" hitSlop={6}>
              <Text style={styles.replyBannerCancel}>취소</Text>
            </Pressable>
          </View>
        ) : null}
        {pendingPhoto ? (
          <View style={styles.attachBanner}>
            <Image
              source={{ uri: pendingPhoto.url }}
              style={styles.attachThumb}
              contentFit="cover"
            />
            <Pressable onPress={removePendingPhoto} accessibilityRole="button" hitSlop={6}>
              <Text style={styles.replyBannerCancel}>취소</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.inputBar}>
          {editingId ? null : (
            <Pressable
              onPress={onAttachPhoto}
              disabled={upload.uploading}
              accessibilityRole="button"
              accessibilityLabel="사진 첨부"
              hitSlop={6}
              style={styles.attachButton}>
              {upload.uploading ? (
                <ActivityIndicator size="small" />
              ) : (
                <IconSymbol name="photo" size={24} color={ios.tint} />
              )}
            </Pressable>
          )}
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={
              editingId
                ? '댓글 수정...'
                : replyingTo
                  ? `@${replyingTo.authorName}에게 답글...`
                  : '댓글 남기기'
            }
            placeholderTextColor={ios.placeholderText}
            multiline
          />
          <Pressable onPress={handleSend} disabled={!canSend} accessibilityRole="button" hitSlop={6}>
            <IconSymbol
              name="arrow.up.circle.fill"
              size={30}
              color={canSend ? ios.tint : ios.systemGray3}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentRow({
  feedback,
  mine,
  onLongPressMine,
  onLike,
  onReply,
}: {
  feedback: Feedback;
  mine: boolean;
  onLongPressMine: (feedback: Feedback) => void;
  onLike: (feedbackId: string) => void;
  /** 최상위 댓글에만 제공 — 답글에 답글은 웹과 동일하게 미지원. */
  onReply?: () => void;
}) {
  const deleted = !!feedback.deletedAt;
  const user = feedback.participant.user;
  const name = authorName(user);
  const attachedUrl = feedback.attachedPhoto?.url ?? feedback.gifUrl ?? null;

  if (deleted) {
    return (
      <View style={styles.row}>
        <View style={[styles.avatar, styles.avatarFallback]}>
          <IconSymbol name="person.fill" size={16} color={ios.tertiaryLabel} />
        </View>
        <Text style={styles.deletedText}>삭제된 댓글입니다</Text>
      </View>
    );
  }

  return (
    <Pressable
      onLongPress={mine ? () => onLongPressMine(feedback) : undefined}
      accessibilityLabel={mine ? '내 댓글 — 길게 눌러 삭제' : undefined}
      style={({ pressed }) => [styles.row, mine && pressed && styles.rowPressed]}>
      {user.profileImageUrl ? (
        <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{name.slice(0, 1)}</Text>
        </View>
      )}
      <View style={styles.rowBody}>
        <View style={styles.metaRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {user.nickname ? (
            <Text style={styles.handle} numberOfLines={1}>
              @{user.nickname}
            </Text>
          ) : null}
          <Text style={styles.time}>{relativeTime(feedback.createdAt)}</Text>
        </View>
        {feedback.content ? <Text style={styles.content}>{feedback.content}</Text> : null}
        {attachedUrl ? (
          <Image source={{ uri: attachedUrl }} style={styles.attachedImage} contentFit="cover" transition={150} />
        ) : null}
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => onLike(feedback.id)}
            accessibilityRole="button"
            accessibilityLabel={feedback.likedByMe ? '좋아요 취소' : '좋아요'}
            hitSlop={6}
            style={styles.likeButton}>
            <IconSymbol
              name={feedback.likedByMe ? 'heart.fill' : 'heart'}
              size={14}
              color={feedback.likedByMe ? ios.systemRed : ios.secondaryLabel}
            />
            {feedback.likeCount > 0 ? (
              <Text style={styles.likeCount}>{feedback.likeCount}</Text>
            ) : null}
          </Pressable>
          {onReply ? (
            <Pressable onPress={onReply} accessibilityRole="button" hitSlop={6}>
              <Text style={styles.replyButtonText}>답글</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ios.systemBackground },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemBackground,
  },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },
  listContent: { paddingHorizontal: iosMetrics.pagePadding, paddingVertical: iosMetrics.spacing[3] },
  pageSpinner: { paddingVertical: iosMetrics.spacing[3] },
  empty: { alignItems: 'center', gap: iosMetrics.spacing[1], paddingVertical: iosMetrics.spacing[16] },
  emptyTitle: { ...iosType.headline, color: ios.label },
  emptyBody: { ...iosType.subhead, color: ios.secondaryLabel },

  itemBlock: {
    paddingVertical: iosMetrics.spacing[2],
    borderBottomWidth: iosMetrics.hairline,
    borderBottomColor: ios.separator,
  },
  replyIndent: { paddingLeft: iosMetrics.spacing[10] },
  row: {
    flexDirection: 'row',
    gap: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[2],
  },
  rowPressed: { opacity: 0.6 },
  rowBody: { flex: 1, gap: iosMetrics.spacing[1] },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ios.systemGray5,
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...iosType.subhead, fontWeight: '600', color: ios.secondaryLabel },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: iosMetrics.spacing[2] },
  name: { ...iosType.subhead, fontWeight: '600', color: ios.label, flexShrink: 1 },
  handle: { ...iosType.footnote, color: ios.secondaryLabel, flexShrink: 1 },
  time: { ...iosType.footnote, color: ios.tertiaryLabel },
  content: { ...iosType.body, color: ios.label },
  attachedImage: {
    width: 200,
    aspectRatio: 1,
    borderRadius: iosMetrics.radius.lg,
    backgroundColor: ios.systemGray5,
    marginTop: iosMetrics.spacing[1],
  },
  deletedText: { ...iosType.body, fontStyle: 'italic', color: ios.tertiaryLabel, alignSelf: 'center' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[4],
    marginTop: iosMetrics.spacing[1],
  },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { ...iosType.footnote, fontWeight: '600', color: ios.secondaryLabel },
  replyButtonText: { ...iosType.footnote, color: ios.tint },

  inputArea: {
    borderTopWidth: iosMetrics.hairline,
    borderTopColor: ios.separator,
    backgroundColor: ios.systemBackground,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: iosMetrics.pagePadding,
    paddingVertical: iosMetrics.spacing[2],
    borderBottomWidth: iosMetrics.hairline,
    borderBottomColor: ios.separator,
  },
  replyBannerText: { ...iosType.footnote, color: ios.tint },
  replyBannerCancel: { ...iosType.footnote, color: ios.secondaryLabel },
  attachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.pagePadding,
    paddingVertical: iosMetrics.spacing[2],
    borderBottomWidth: iosMetrics.hairline,
    borderBottomColor: ios.separator,
  },
  attachThumb: {
    width: 48,
    height: 48,
    borderRadius: iosMetrics.radius.sm,
    backgroundColor: ios.systemGray5,
  },
  attachButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: iosMetrics.spacing[2],
    paddingHorizontal: iosMetrics.pagePadding,
    paddingTop: iosMetrics.spacing[2],
  },
  input: {
    flex: 1,
    ...iosType.body,
    color: ios.label,
    maxHeight: 120,
    minHeight: 38,
    paddingHorizontal: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[2],
    borderRadius: iosMetrics.radius.xl,
    backgroundColor: ios.systemGray6,
  },
});
