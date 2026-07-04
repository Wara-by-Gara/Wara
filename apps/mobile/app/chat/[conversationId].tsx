// DM 채팅방 — inverted FlatList(최신 하단) + 하단 입력바. 실시간 수신은 useDmSocket.
// 앱 크롬이므로 색상/메트릭은 theme 토큰 + components/ios 킷만 사용.
// 말풍선 색: 내 메시지 systemBlue 배경/흰 글자, 상대 systemGray5 배경/label 글자.

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError, fetchMe, userKeys } from '@/api';
import {
  conversationKeys,
  getMessageImagePresignedUrl,
  sendImageMessage,
  type Message,
} from '@/api/conversations';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useConversation, useMarkRead, useMessages, useSendMessage } from '@/hooks/queries/conversations';
import { useDmSocket } from '@/hooks/socket/useDmSocket';

function messageForError(err: unknown): string {
  if (err instanceof WaraApiError) {
    switch (err.code) {
      case 'CONVERSATION_NOT_FOUND':
        return '대화방을 찾을 수 없어요';
      case 'CONVERSATION_FORBIDDEN':
        return '이 대화방에 접근할 수 없어요';
      case 'MESSAGE_NOT_FOUND':
        return '메시지를 찾을 수 없어요';
      case 'MESSAGE_FORBIDDEN':
        return '본인 메시지만 처리할 수 있어요';
      case 'CANNOT_MESSAGE_SELF':
        return '자기 자신과는 대화할 수 없어요';
      case 'INVALID_ULID':
        return '잘못된 대화방이에요';
    }
  }
  return '문제가 발생했어요';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
}

export default function ChatRoomScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const meQuery = useQuery({ queryKey: userKeys.me(), queryFn: ({ signal }) => fetchMe(signal) });
  const meId = meQuery.data?.id ?? '';

  const detailQuery = useConversation(conversationId);
  const messagesQuery = useMessages(conversationId);
  const sendMutation = useSendMessage(conversationId, meId);
  const markRead = useMarkRead(conversationId);

  const [draft, setDraft] = useState('');

  // ── 이미지 첨부: 단일 선택 → useImageUpload → 전송 후 메시지/목록 캐시 갱신 ────────
  const qc = useQueryClient();
  const imageUpload = useImageUpload<Message>({
    getPresignedUrl: (fileName, contentType) =>
      getMessageImagePresignedUrl(conversationId, fileName, contentType),
    register: (meta) => sendImageMessage(conversationId, meta.imageKey),
  });

  const onAttachImage = async () => {
    const sent = await imageUpload.pickAndUpload({ allowsMultipleSelection: false });
    if (sent.length > 0) {
      void qc.invalidateQueries({ queryKey: conversationKeys.messages(conversationId) });
      void qc.invalidateQueries({ queryKey: conversationKeys.list() });
    }
  };

  useEffect(() => {
    if (imageUpload.error) {
      Alert.alert('사진 전송', imageUpload.error);
      imageUpload.reset();
    }
  }, [imageUpload.error, imageUpload.reset]);

  // 방 진입 시 읽음 처리.
  useEffect(() => {
    if (conversationId) markRead.mutate();
    // markRead.mutate는 안정 참조 — id 변경 시에만 실행.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // 실시간 수신 → 캐시 갱신. 활성 방 새 메시지는 읽음 처리.
  useDmSocket({
    activeConversationId: conversationId,
    onMessageNew: useCallback(() => markRead.mutate(), [markRead]),
  });

  // 페이지들을 최신→오래된 순으로 평탄화 (inverted FlatList: index 0 = 하단 = 최신).
  const messages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    return pages.flatMap((p) => [...p.messages].reverse());
  }, [messagesQuery.data]);

  const canSend = draft.trim().length > 0 && !!meId && !sendMutation.isPending;

  function handleSend() {
    const content = draft.trim();
    if (!content || !meId) return;
    setDraft('');
    sendMutation.mutate({ content });
  }

  const title = detailQuery.data?.title || detailQuery.data?.partner?.name || '대화';

  if (messagesQuery.isPending || meQuery.isPending) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (messagesQuery.error) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title }} />
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(messagesQuery.error)}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <Stack.Screen options={{ title }} />
      <FlatList
        style={styles.list}
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="interactive"
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
            void messagesQuery.fetchNextPage();
          }
        }}
        ListFooterComponent={
          messagesQuery.isFetchingNextPage ? (
            <ActivityIndicator style={styles.pageSpinner} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>첫 메시지를 보내보세요</Text>
          </View>
        }
        renderItem={({ item }) => <MessageBubble message={item} mine={item.senderId === meId} />}
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, iosMetrics.spacing[2]) }]}>
        <Pressable
          onPress={onAttachImage}
          disabled={imageUpload.uploading}
          accessibilityRole="button"
          accessibilityLabel="사진 첨부"
          hitSlop={6}
          style={styles.attachButton}>
          {imageUpload.uploading ? (
            <ActivityIndicator />
          ) : (
            <IconSymbol name="photo.badge.plus" size={26} color={ios.tint} />
          )}
        </Pressable>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="메시지"
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
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  if (message.type === 'system') {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  const isTemp = message.id.startsWith('temp-');
  const readMeta = mine
    ? isTemp
      ? '전송 중'
      : message.unreadCount > 0
        ? String(message.unreadCount)
        : '읽음'
    : null;

  const isImage = !message.deleted && !!message.imageUrl;

  return (
    <View style={[styles.bubbleRow, mine ? styles.alignEnd : styles.alignStart]}>
      <View
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleOther,
          isImage && styles.bubbleImageWrap,
        ]}>
        {message.replyTo ? (
          <Text style={[styles.reply, mine ? styles.replyMine : styles.replyOther]} numberOfLines={1}>
            {message.replyTo.deleted ? '삭제된 메시지' : message.replyTo.content}
          </Text>
        ) : null}
        {message.deleted ? (
          <Text style={[styles.deleted, mine ? styles.textMine : styles.textOther]}>삭제된 메시지</Text>
        ) : message.imageUrl ? (
          <Image
            source={{ uri: message.imageUrl }}
            style={styles.bubbleImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Text style={mine ? styles.textMine : styles.textOther}>{message.content}</Text>
        )}
      </View>
      <View style={[styles.metaRow, mine ? styles.alignEnd : styles.alignStart]}>
        {readMeta ? <Text style={styles.readMeta}>{readMeta}</Text> : null}
        <Text style={styles.timeMeta}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ios.systemBackground },
  list: { flex: 1 },
  listContent: { paddingHorizontal: iosMetrics.pagePadding, paddingVertical: iosMetrics.spacing[3] },
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
  empty: { alignItems: 'center', paddingVertical: iosMetrics.spacing[16], transform: [{ scaleY: -1 }] },
  emptyText: { ...iosType.subhead, color: ios.secondaryLabel },
  pageSpinner: { paddingVertical: iosMetrics.spacing[3] },

  bubbleRow: { marginVertical: iosMetrics.spacing[1], maxWidth: '80%' },
  alignEnd: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignStart: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    paddingHorizontal: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[2],
    borderRadius: iosMetrics.radius.xl,
  },
  bubbleMine: { backgroundColor: ios.tint },
  bubbleOther: { backgroundColor: ios.systemGray5 },
  bubbleImageWrap: { padding: 0, backgroundColor: 'transparent', overflow: 'hidden' },
  bubbleImage: {
    width: 220,
    aspectRatio: 1,
    borderRadius: iosMetrics.radius.xl,
    backgroundColor: ios.systemGray5,
  },
  textMine: { ...iosType.body, color: '#FFFFFF' },
  textOther: { ...iosType.body, color: ios.label },
  deleted: { ...iosType.body, fontStyle: 'italic', opacity: 0.7 },
  reply: { ...iosType.footnote, marginBottom: 2 },
  replyMine: { color: '#FFFFFF', opacity: 0.8 },
  replyOther: { color: ios.secondaryLabel },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[1], marginTop: 2 },
  readMeta: { ...iosType.caption2, color: ios.tint },
  timeMeta: { ...iosType.caption2, color: ios.tertiaryLabel },

  systemRow: { alignItems: 'center', marginVertical: iosMetrics.spacing[2] },
  systemText: { ...iosType.caption1, color: ios.secondaryLabel },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: iosMetrics.spacing[2],
    paddingHorizontal: iosMetrics.pagePadding,
    paddingTop: iosMetrics.spacing[2],
    borderTopWidth: iosMetrics.hairline,
    borderTopColor: ios.separator,
    backgroundColor: ios.systemBackground,
  },
  attachButton: { paddingBottom: iosMetrics.spacing[1] },
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
