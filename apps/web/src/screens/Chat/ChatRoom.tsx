"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/primitives/Avatar";
import { Icon } from "@/components/icons";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { Modal, ModalContent, ModalClose, ModalPrimitive } from "@/components/molecules/Modal";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { toast } from "@/components/molecules/Toast";
import { ChatDrawer } from "@/screens/Chat/ChatDrawer";
import { PhotoViewer, type ViewerPhoto } from "@/screens/Chat/PhotoViewer";
import { useMe } from "@/hooks/useUsers";
import {
  useConversation,
  useChatMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useChatRealtime,
  useToggleReaction,
  useMessageReactors,
  useConversationParticipants,
  useSendImageMessage,
} from "@/hooks/useChat";
import {
  REACTION_EMOJIS,
  REACTION_EMOJI_CHAR,
  MESSAGE_IMAGE_TYPES,
  type Message,
  type ReactionEmoji,
} from "@/lib/api/conversations";
import { ROUTES } from "@/constants/routes";

const LONG_PRESS_MS = 500;
// 메시지 최대 길이 - 백엔드 send-message DTO(.max(2000))와 일치시킨다.
const MAX_MESSAGE = 2000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface ChatRoomProps {
  id: string;
}

export const ChatRoom = ({ id }: ChatRoomProps) => {
  const router = useRouter();
  const { data: me } = useMe();
  const myId = me?.id;
  const { data: conversation } = useConversation(id);
  const { messages, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useChatMessages(id);
  const sendMutation = useSendMessage(id);
  const editMutation = useEditMessage(id);
  const deleteMutation = useDeleteMessage(id);
  const reactMutation = useToggleReaction(id);
  const imageMutation = useSendImageMessage(id);
  useChatRealtime(id);

  const [text, setText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewer, setViewer] = useState<{
    photos: ViewerPhoto[];
    index: number;
  } | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // PC만 진입 시 입력창 자동 포커스 - 마우스 클릭 없이 바로 타이핑.
  // 모바일은 진입하자마자 키보드가 올라와 메시지를 가리므로 제외(정밀 포인터 기기만).
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, [id]);

  // 메시지 길게 누르기 -> 메뉴
  const [menuTarget, setMenuTarget] = useState<Message | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);

  // 사진 전송: 선택 즉시 보내지 않고 미리보기 후 확인 -> 오발송 방지 (카톡과 동일 흐름)
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  // 리액션 배지 꾸욱 누르기 -> 누가 어떤 이모지를 눌렀는지 상세 시트
  const [reactionDetail, setReactionDetail] = useState<Message | null>(null);
  // 상세 시트 이모지 필터 (null = 전체). 다른 메시지 열면 초기화.
  const [reactionFilter, setReactionFilter] = useState<string | null>(null);
  const reactorsQuery = useMessageReactors(id, reactionDetail?.id ?? null);
  const reactors = reactorsQuery.data?.reactors ?? [];
  useEffect(() => {
    setReactionFilter(null);
  }, [reactionDetail?.id]);
  const reactionPressTimer = useRef<number | null>(null);
  const reactionLongPressed = useRef(false);
  const startReactionPress = (m: Message) => {
    reactionLongPressed.current = false;
    reactionPressTimer.current = window.setTimeout(() => {
      reactionLongPressed.current = true;
      setReactionDetail(m);
    }, LONG_PRESS_MS);
  };
  const cancelReactionPress = () => {
    if (reactionPressTimer.current) {
      clearTimeout(reactionPressTimer.current);
      reactionPressTimer.current = null;
    }
  };
  const pressTimer = useRef<number | null>(null);
  const pressFired = useRef(false); // 길게누르기 발동 여부 (탭=사진 뷰어 / 길게=메뉴 구분)
  const startPress = (m: Message) => {
    pressFired.current = false;
    pressTimer.current = window.setTimeout(() => {
      pressFired.current = true;
      setMenuTarget(m);
    }, LONG_PRESS_MS);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const menuMine = menuTarget?.senderId === myId;
  const menuIsImage = !!menuTarget?.imageUrl; // 사진 메시지는 복사/수정 불가
  const handleCopy = () => {
    if (menuTarget) {
      navigator.clipboard?.writeText(menuTarget.content);
      toast.show("복사했어요");
    }
    setMenuTarget(null);
  };
  const handleReact = (emoji: ReactionEmoji) => {
    if (menuTarget) reactMutation.mutate({ messageId: menuTarget.id, emoji });
    setMenuTarget(null);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("10MB 이하 이미지만 보낼 수 있어요");
      return;
    }
    setPreviewFile(file); // 바로 보내지 않고 미리보기 모달 띄움
  };
  const handleSendImage = () => {
    if (!previewFile) return;
    imageMutation.mutate(previewFile, {
      onSuccess: () => setPreviewFile(null),
      onError: () => toast.error("사진을 보내지 못했어요. 다시 시도해주세요"),
    });
  };
  const openDelete = () => {
    setDeleteTarget(menuTarget);
    setMenuTarget(null);
  };
  const startEdit = () => {
    if (!menuTarget) return;
    setReplyTarget(null);
    setEditing(menuTarget);
    setText(menuTarget.content);
    setMenuTarget(null);
  };
  const cancelEdit = () => {
    setEditing(null);
    setText("");
  };
  const startReply = () => {
    if (!menuTarget) return;
    setEditing(null);
    setText("");
    setReplyTarget(menuTarget);
    setMenuTarget(null);
  };
  const cancelReply = () => setReplyTarget(null);

  const partnerName = conversation?.partner?.name ?? "상대";
  const isGroup = conversation?.type === "group";
  const headerTitle = conversation?.title ?? partnerName;
  // 그룹: 발신자별 아바타/이름 표시용 멤버 맵 (그룹일 때만 조회)
  const groupMembers =
    useConversationParticipants(id, !!isGroup).data?.participants ?? [];
  const memberMap = new Map(groupMembers.map((p) => [p.userId, p]));

  // 발신자 표시 이름 (그룹=멤버맵, 1:1=상대, 내것=내 이름)
  const displayNameOf = (senderId: string) =>
    senderId === myId
      ? (me?.name ?? "나")
      : isGroup
        ? (memberMap.get(senderId)?.name ?? "사용자")
        : partnerName;
  // 대화 내 사진 메시지 목록 (뷰어 < > 이동용)
  const imageMessages = messages.filter((m) => m.imageUrl && !m.deleted);
  const chatPhotos: ViewerPhoto[] = imageMessages.map((m) => ({
    imageUrl: m.imageUrl!,
    uploaderName: displayNameOf(m.senderId),
    createdAt: m.createdAt,
  }));

  // 새 메시지/입장 시 맨 아래로 스크롤
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastMessageId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    // maxLength는 입력창 UI 가드일 뿐 - 전송 직전에도 길이를 방어한다 (defense in depth)
    if (!content || content.length > MAX_MESSAGE) return;

    if (editing) {
      if (editMutation.isPending) return;
      editMutation.mutate(
        { messageId: editing.id, content },
        {
          onSuccess: cancelEdit,
          // 실패해도 수정 상태/입력은 유지해 재시도 가능하게 하고 알림만 (send와 대칭)
          onError: (err) => {
            toast.error("메시지를 수정하지 못했어요. 다시 시도해주세요");
            console.warn("[dm] edit failed", err);
          },
        },
      );
      return;
    }

    if (sendMutation.isPending) return;
    // 입력은 즉시 비우되(스냅감), 실패하면 내용/답장 대상을 복원하고 알린다.
    const reply = replyTarget;
    setText("");
    setReplyTarget(null);
    sendMutation.mutate(
      { content, replyToMessageId: reply?.id },
      {
        onError: (err) => {
          setText(content);
          setReplyTarget(reply);
          toast.error("메시지를 보내지 못했어요. 다시 시도해주세요");
          // 관측용: 전송 실패를 태그와 함께 남김 (원격 트래커 도입 시 이 지점에서 전송)
          console.warn("[dm] send failed", err);
        },
      },
    );
  };

  // 헤더 이름/아바타 또는 상대 말풍선 아바타 클릭 -> 상대 프로필(친구 화면 재사용)
  const partnerId = conversation?.partner?.id;
  const goProfile = () => {
    if (partnerId) router.push(ROUTES.FRIENDS.DETAIL(partnerId));
  };
  const goUserProfile = (userId: string) =>
    router.push(ROUTES.FRIENDS.DETAIL(userId));

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col bg-background-soft">
      <TopAppBar
        onBack={() => router.back()}
        largeTitle
        className="min-h-0 pt-2"
        title={
          isGroup ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="block w-full truncate text-left text-[16px] font-bold text-text-primary active:opacity-70"
            >
              {headerTitle}
              <span className="ml-1 text-[14px] font-normal text-text-tertiary">
                {conversation?.memberCount}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={goProfile}
              disabled={!partnerId}
              aria-label={`${partnerName} 프로필 보기`}
              className="block w-full truncate text-left text-[16px] font-bold text-text-primary active:opacity-70 disabled:cursor-default disabled:active:opacity-100"
            >
              {partnerName}
            </button>
          )
        }
        rightSlot={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="대화방 메뉴"
            className="flex size-9 items-center justify-center rounded-full text-text-secondary active:opacity-70"
          >
            <Icon name="menu" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-page">
        {hasNextPage && (
          <div className="flex justify-center py-3">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-[13px] text-text-tertiary active:opacity-70"
            >
              {isFetchingNextPage ? "불러오는 중..." : "이전 메시지 보기"}
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="py-10 text-center text-[14px] text-text-tertiary">불러오는 중...</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-text-tertiary">
            첫 메시지를 보내보세요
          </p>
        ) : (
          <ul className="flex flex-col gap-2 py-3">
            {messages.map((m, i) => {
              // 시스템 메시지(입장/퇴장 안내) — 말풍선 없이 가운데 표시
              if (m.type === "system") {
                return (
                  <li key={m.id} className="my-1 flex justify-center">
                    <span className="rounded-full bg-background-soft px-3 py-1 text-[12px] text-text-tertiary">
                      {m.content}
                    </span>
                  </li>
                );
              }
              const mine = m.senderId === myId;
              // 연속 그룹의 첫 메시지 (보낸 사람이 바뀌는 지점)
              const firstOfGroup = messages[i - 1]?.senderId !== m.senderId;
              // 상대 메시지의 첫 번째에만 프로필 표시
              const showAvatar = !mine && firstOfGroup;
              // 발신자 표시정보 — 그룹은 멤버맵, 1:1은 상대
              const sender = memberMap.get(m.senderId);
              const senderName = isGroup ? (sender?.name ?? "사용자") : partnerName;
              const senderAvatar = isGroup
                ? (sender?.avatarUrl ?? null)
                : (conversation?.partner?.avatarUrl ?? null);
              // 각 그룹 첫 말풍선은 자기 쪽으로 꼬리(tail) 표시
              const bubbleClass = mine
                ? firstOfGroup
                  ? "rounded-tr-sm bg-primary text-text-inverse before:absolute before:-right-[5px] before:top-2.5 before:size-0 before:border-y-[6px] before:border-l-[7px] before:border-y-transparent before:border-l-primary before:content-['']"
                  : "rounded-br-sm bg-primary text-text-inverse"
                : showAvatar
                  ? "rounded-tl-sm bg-surface text-text-primary before:absolute before:-left-[5px] before:top-2.5 before:size-0 before:border-y-[6px] before:border-r-[7px] before:border-y-transparent before:border-r-surface before:content-['']"
                  : "rounded-bl-sm bg-surface text-text-primary";
              return (
                <li
                  key={m.id}
                  data-testid="chat-message"
                  data-message-id={m.id}
                  className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!mine &&
                    (showAvatar ? (
                      <button
                        type="button"
                        onClick={() =>
                          isGroup ? goUserProfile(m.senderId) : goProfile()
                        }
                        aria-label={`${senderName} 프로필 보기`}
                        className="self-start active:opacity-70"
                      >
                        <Avatar
                          size="sm"
                          src={senderAvatar ?? undefined}
                          alt={senderName}
                          initial={senderName[0]}
                        />
                      </button>
                    ) : (
                      <span className="w-9 shrink-0" aria-hidden />
                    ))}
                  {/* 말풍선 + (그 아래) 리액션 배지를 세로로 묶는다 */}
                  <div
                    className={`flex min-w-0 max-w-[72%] flex-col gap-1 ${
                      mine ? "items-end" : "items-start"
                    }`}
                  >
                    {/* 그룹: 상대 메시지 묶음 첫 줄에 발신자 이름 */}
                    {isGroup && !mine && firstOfGroup && (
                      <span className="px-1 text-[12px] text-text-tertiary">
                        {senderName}
                      </span>
                    )}
                    {m.deleted ? (
                      <div className="rounded-2xl border border-border bg-surface px-3.5 py-2 text-[14px] text-text-tertiary">
                        삭제된 메시지입니다
                      </div>
                    ) : m.imageUrl ? (
                      // 이미지 메시지 — 테두리/배경 없이 이미지만 (길게눌러 리액션/답장/삭제 가능)
                      <div
                        onPointerDown={() => startPress(m)}
                        onPointerUp={cancelPress}
                        onPointerLeave={cancelPress}
                        onPointerCancel={cancelPress}
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={() => {
                          if (pressFired.current) return; // 길게누르기였으면 메뉴만
                          if (!m.imageUrl) return;
                          // 대화 내 전체 사진 중 이 사진부터 -> 뷰어에서 < > 이동
                          const idx = imageMessages.findIndex((x) => x.id === m.id);
                          setViewer({ photos: chatPhotos, index: idx < 0 ? 0 : idx });
                        }}
                        className="relative max-w-full cursor-pointer select-none overflow-hidden rounded-2xl"
                      >
                        {/* presigned S3 URL은 만료·쿼리파라미터라 next/image 부적합 (기존 사진 기능 관례) */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.imageUrl}
                          alt="사진"
                          className="block max-h-64 max-w-full"
                        />
                      </div>
                    ) : (
                      <div
                        onPointerDown={() => startPress(m)}
                        onPointerUp={cancelPress}
                        onPointerLeave={cancelPress}
                        onPointerCancel={cancelPress}
                        onContextMenu={(e) => e.preventDefault()}
                        // 답장(인용) 말풍선은 짧으면 콘텐츠 폭에 맞춰 좁아지므로 최소 너비를 줘
                        // 우측으로 더 길게 + 인용문이 좌측정렬로 보이게 한다.
                        className={`relative max-w-full cursor-pointer select-none whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] ${
                          m.replyTo ? "min-w-[120px] text-left" : ""
                        } ${bubbleClass}`}
                      >
                        {m.replyTo && (
                          <div
                            className={`mb-2 border-b pb-2 ${
                              mine ? "border-text-inverse/30" : "border-text-tertiary/30"
                            }`}
                          >
                            <p
                              className={`text-[11px] font-bold ${
                                mine ? "text-text-inverse/90" : "text-text-secondary"
                              }`}
                            >
                              {m.replyTo.senderId === myId ? "나" : partnerName}
                            </p>
                            <p
                              className={`truncate text-[12px] ${
                                mine ? "text-text-inverse/70" : "text-text-tertiary"
                              }`}
                            >
                              {m.replyTo.deleted ? "삭제된 메시지" : m.replyTo.content}
                            </p>
                          </div>
                        )}
                        {m.content}
                      </div>
                    )}
                    {/* 리액션 배지 — 말풍선 외부 아래, 페이지 배경 위 칩 */}
                    {!m.deleted && m.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-0.5">
                        {m.reactions.map((r) => (
                          <button
                            key={r.emoji}
                            type="button"
                            // 꾸욱 누르면 상세 시트, 짧게 탭하면 토글
                            onPointerDown={() => startReactionPress(m)}
                            onPointerUp={cancelReactionPress}
                            onPointerLeave={cancelReactionPress}
                            onClick={() => {
                              if (reactionLongPressed.current) {
                                reactionLongPressed.current = false;
                                return;
                              }
                              reactMutation.mutate({
                                messageId: m.id,
                                emoji: r.emoji as ReactionEmoji,
                              });
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-[11px] text-text-secondary shadow-sm ring-1 active:opacity-70 ${
                              m.myReaction === r.emoji ? "ring-brand" : "ring-border"
                            }`}
                          >
                            <span>{REACTION_EMOJI_CHAR[r.emoji as ReactionEmoji] ?? r.emoji}</span>
                            <span className="font-bold">{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex shrink-0 flex-col justify-end gap-0.5 leading-none ${
                      mine ? "items-end" : "items-start"
                    }`}
                  >
                    {(isGroup || mine) && !m.deleted && m.unreadCount > 0 && (
                      <span
                        data-testid="read-receipt"
                        className="text-[11px] font-bold text-primary"
                      >
                        {m.unreadCount}
                      </span>
                    )}
                    {m.edited && !m.deleted && (
                      <span className="text-[10px] text-text-tertiary">수정됨</span>
                    )}
                    <span className="text-[10px] text-text-tertiary">
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-border bg-surface px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        {editing && (
          <div className="mb-2 flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-text-primary">메시지 수정</p>
              <p className="truncate text-[13px] text-text-tertiary">{editing.content}</p>
            </div>
            <button
              type="button"
              onClick={cancelEdit}
              aria-label="수정 취소"
              className="shrink-0 p-1 text-text-tertiary active:opacity-70"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
        {replyTarget && (
          <div className="mb-2 flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M9 17l-5-5 5-5M4 12h9a5 5 0 0 1 5 5v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-text-primary">
                {replyTarget.senderId === myId ? "나" : partnerName}에게 답장
              </p>
              <p className="truncate text-[13px] text-text-tertiary">
                {replyTarget.deleted ? "삭제된 메시지" : replyTarget.content}
              </p>
            </div>
            <button
              type="button"
              onClick={cancelReply}
              aria-label="답장 취소"
              className="shrink-0 p-1 text-text-tertiary active:opacity-70"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        {/* 한도 근처에서만 글자수 카운터 노출 (백엔드 2000자 제한과 일치) */}
        {text.length >= MAX_MESSAGE - 100 && (
          <p
            className={`mb-1 pr-1 text-right text-[11px] ${
              text.length >= MAX_MESSAGE ? "text-danger" : "text-text-tertiary"
            }`}
          >
            {text.length}/{MAX_MESSAGE}
          </p>
        )}
        <div className="flex items-center gap-2">
        {/* 사진 보내기 (모바일 웹에선 카메라/갤러리 선택) */}
        <input
          ref={fileInputRef}
          type="file"
          accept={MESSAGE_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={handlePickImage}
        />
        <button
          type="button"
          aria-label="사진 보내기"
          onClick={() => fileInputRef.current?.click()}
          disabled={imageMutation.isPending || !!editing}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-text-secondary active:opacity-70 disabled:opacity-40"
        >
          <Icon name="image" size="lg" color="currentColor" decorative />
        </button>
        <input
          ref={inputRef}
          data-testid="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_MESSAGE}
          // 한글 조합 중 Enter는 글자 확정용 -> 전송(폼 submit) 막아 오발송/글자깨짐 방지
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault();
          }}
          placeholder={editing ? "수정 메시지 입력" : "메시지를 입력하세요"}
          className="h-10 flex-1 rounded-full bg-background-soft px-4 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <button
          type="submit"
          aria-label={editing ? "수정 완료" : "전송"}
          disabled={!text.trim() || sendMutation.isPending || editMutation.isPending}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-text-inverse transition-opacity disabled:opacity-40"
        >
          {editing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 19V5M12 5l-6 6M12 5l6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        </div>
      </form>

      {/* 메시지 길게 누르기 메뉴 */}
      <Modal open={!!menuTarget} onOpenChange={(open) => !open && setMenuTarget(null)}>
        <ModalContent className="max-w-[260px] px-3 py-2" aria-describedby={undefined}>
          <ModalPrimitive.Title className="sr-only">메시지 메뉴</ModalPrimitive.Title>
          <div className="flex flex-col">
            {/* 이모지 리액션 행 (메뉴 최상단) */}
            <div className="mb-1 flex items-center justify-between border-b border-border px-1 pb-2">
              {REACTION_EMOJIS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`${key} 리액션`}
                  onClick={() => handleReact(key)}
                  className={`flex size-7 items-center justify-center rounded-full text-[16px] active:bg-background-soft ${
                    menuTarget?.myReaction === key ? "bg-background-soft" : ""
                  }`}
                >
                  {REACTION_EMOJI_CHAR[key]}
                </button>
              ))}
            </div>
            {!menuIsImage && (
              <button
                type="button"
                onClick={handleCopy}
                className="w-full rounded-lg py-3 text-left text-[15px] font-bold text-text-primary active:bg-background-soft"
              >
                복사
              </button>
            )}
            <button
              type="button"
              onClick={startReply}
              className="w-full rounded-lg py-3 text-left text-[15px] font-bold text-text-primary active:bg-background-soft"
            >
              답장
            </button>
            {menuMine && (
              <>
                {!menuIsImage && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="w-full rounded-lg py-3 text-left text-[15px] font-bold text-text-primary active:bg-background-soft"
                  >
                    수정
                  </button>
                )}
                <button
                  type="button"
                  onClick={openDelete}
                  className="w-full rounded-lg py-3 text-left text-[15px] font-bold text-red-500 active:bg-background-soft"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </ModalContent>
      </Modal>

      {/* 메시지 삭제 확인 모달 */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <ModalContent className="max-w-[300px]">
          <ModalPrimitive.Title className="text-[17px] font-bold text-text-primary">
            메시지 삭제
          </ModalPrimitive.Title>
          <ModalPrimitive.Description className="mt-2 text-[14px] text-text-secondary">
            이 메시지를 삭제하면 상대방 화면에서도 사라집니다.
          </ModalPrimitive.Description>
          <div className="mt-6 flex justify-end gap-6">
            <ModalClose asChild>
              <button type="button" className="text-[15px] font-bold text-blue-500">
                취소
              </button>
            </ModalClose>
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                });
              }}
              className="text-[15px] font-bold text-blue-500 disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        </ModalContent>
      </Modal>

      {/* 사진 전송 미리보기 + 확인 */}
      <Modal
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open && !imageMutation.isPending) setPreviewFile(null);
        }}
      >
        <ModalContent className="max-w-[320px]" aria-describedby={undefined}>
          <ModalPrimitive.Title className="text-[17px] font-bold text-text-primary">
            사진 보내기
          </ModalPrimitive.Title>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="보낼 사진 미리보기"
              className="mt-3 max-h-80 w-full rounded-lg bg-background-soft object-contain"
            />
          )}
          <div className="mt-6 flex justify-end gap-6">
            <ModalClose asChild>
              <button
                type="button"
                disabled={imageMutation.isPending}
                className="text-[15px] font-bold text-blue-500 disabled:opacity-50"
              >
                취소
              </button>
            </ModalClose>
            <button
              type="button"
              disabled={imageMutation.isPending}
              onClick={handleSendImage}
              className="text-[15px] font-bold text-blue-500 disabled:opacity-50"
            >
              {imageMutation.isPending ? "보내는 중..." : "보내기"}
            </button>
          </div>
        </ModalContent>
      </Modal>

      {/* 리액션 상세 — 누가 어떤 이모지를 눌렀는지 */}
      <BottomSheet
        open={!!reactionDetail}
        onOpenChange={(open) => !open && setReactionDetail(null)}
      >
        <BottomSheetContent title={<span className="block w-full text-center">리액션</span>}>
          {/* 상단 이모지+카운트 칩 — 클릭해서 종류별로 필터
              data-vaul-no-drag: 칩 탭 시 시트가 드래그로 닫히는 것 방지 */}
          <div data-vaul-no-drag className="flex flex-wrap gap-2 pb-2">
            <button
              type="button"
              onClick={() => setReactionFilter(null)}
              className={`rounded-full px-3 py-1 text-[14px] font-bold ring-1 active:opacity-70 ${
                reactionFilter === null
                  ? "bg-primary text-text-inverse ring-primary"
                  : "text-text-secondary ring-border"
              }`}
            >
              전체 {reactors.length}
            </button>
            {reactionDetail?.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => setReactionFilter(r.emoji)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] ring-1 active:opacity-70 ${
                  reactionFilter === r.emoji
                    ? "bg-primary text-text-inverse ring-primary"
                    : "ring-border"
                }`}
              >
                <span>{REACTION_EMOJI_CHAR[r.emoji as ReactionEmoji] ?? r.emoji}</span>
                <span className="font-bold">{r.count}</span>
              </button>
            ))}
          </div>
          {/* 리액션한 사람 목록 (필터 적용)
              minHeight: 필터해도 시트(하단 고정) 높이가 줄지 않게 전체 인원 기준으로 고정.
              줄어들면 칩이 아래로 밀려 모바일 ghost click이 오버레이에 떨어지며 시트가 닫힘. */}
          <ul className="flex flex-col" style={{ minHeight: reactors.length * 52 }}>
            {reactors
              .filter((rc) => !reactionFilter || rc.emoji === reactionFilter)
              .map((rc) => (
                <li key={rc.userId} className="flex h-13 items-center gap-3">
                  <Avatar size="sm" src={rc.avatarUrl ?? undefined} name={rc.name ?? undefined} />
                  <span className="flex-1 text-[15px] text-text-primary">
                    {rc.name ?? "사용자"}
                  </span>
                  <span className="text-[20px]">
                    {REACTION_EMOJI_CHAR[rc.emoji as ReactionEmoji] ?? rc.emoji}
                  </span>
                </li>
              ))}
          </ul>
        </BottomSheetContent>
      </BottomSheet>

      {/* 우측 슬라이딩 서랍 — 사진/대화상대/초대 */}
      <ChatDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        conversationId={id}
        isDirect={!isGroup}
        roomTitle={headerTitle}
        onPhotoClick={(photos, index) => setViewer({ photos, index })}
      />

      {/* 사진 크게 보기 + 다운로드 */}
      <PhotoViewer
        photos={viewer?.photos ?? null}
        startIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </div>
  );
};
