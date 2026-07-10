"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { Avatar, SearchBar, BottomSheet, Modal, ConfirmDialog, toast } from "@wara/ui";
import { useMe } from "@/hooks/useUsers";
import { useFriends } from "@/hooks/useFriends";
import { useLeaveConversation } from "@/hooks/useConversations";
import {
  useConversationParticipants,
  useConversationPhotos,
  useInvite,
  useSetAlias,
} from "@/hooks/useChat";
import { ROUTES } from "@/constants/routes";
import { matchName } from "@/screens/Friends/initials";
import type { ViewerPhoto } from "@/screens/Chat/PhotoViewer";

// 채팅방 우측 슬라이딩 서랍 — 사진 갤러리 + 대화상대 목록 + 초대
export function ChatDrawer({
  open,
  onOpenChange,
  conversationId,
  isDirect,
  roomTitle,
  onPhotoClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  isDirect: boolean;
  roomTitle: string;
  onPhotoClick: (photos: ViewerPhoto[], index: number) => void;
}) {
  const { data: me } = useMe();
  const router = useRouter();
  const leave = useLeaveConversation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  // 서랍 열릴 때만 조회 (enabled = open)
  const photos = useConversationPhotos(conversationId, open).data?.photos ?? [];
  const participants =
    useConversationParticipants(conversationId, open).data?.participants ?? [];
  const memberIds = participants.map((p) => p.userId);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/48" />
        <Drawer.Content className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-[360px] flex-col bg-surface focus:outline-none">
          <Drawer.Title className="px-page py-4 text-[18px] font-bold text-text">
            메뉴
          </Drawer.Title>
          <div className="flex-1 overflow-y-auto px-page pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {/* 방 이름 (그룹) — 내 개인 별명 변경 */}
            {!isDirect && (
              <section className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-text-disabled">채팅방 이름</p>
                  <p className="truncate text-[15px] font-bold text-text">
                    {roomTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAliasOpen(true)}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[13px] font-bold text-text-muted active:opacity-70"
                >
                  변경
                </button>
              </section>
            )}

            {/* 사진 갤러리 */}
            <section className="pb-6">
              <h3 className="mb-2 text-[14px] font-bold text-text-muted">
                사진
              </h3>
              {photos.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-text-disabled">
                  주고받은 사진이 없어요
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {photos.map((p, i) => (
                    <button
                      key={p.messageId}
                      type="button"
                      onClick={() => {
                        onPhotoClick(
                          photos.map((ph) => ({
                            imageUrl: ph.imageUrl,
                            uploaderName: ph.uploaderName,
                            createdAt: ph.createdAt,
                          })),
                          i,
                        );
                        // 드로어(모달)를 닫아 뷰어가 위에서 정상 동작하게 함
                        onOpenChange(false);
                      }}
                      className="aspect-square overflow-hidden rounded-md active:opacity-70"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl}
                        alt="사진"
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 대화상대 */}
            <section>
              <h3 className="mb-2 text-[14px] font-bold text-text-muted">
                대화상대 {participants.length}
              </h3>
              <ul className="flex flex-col">
                {participants.map((p) => (
                  <li key={p.userId} className="flex items-center gap-3 py-2">
                    <Avatar
                      size="sm"
                      src={p.avatarUrl ?? undefined}
                      name={p.name ?? undefined}
                    />
                    <span className="text-[15px] text-text">
                      {p.name ?? "사용자"}
                      {p.userId === me?.id ? " (나)" : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="mt-3 w-full rounded-lg border border-border py-2.5 text-[14px] font-bold text-text-muted active:opacity-70"
              >
                초대하기
              </button>
              {!isDirect && (
                <button
                  type="button"
                  onClick={() => setLeaveOpen(true)}
                  className="mt-2 w-full rounded-lg py-2.5 text-[14px] font-bold text-danger active:opacity-70"
                >
                  채팅방 나가기
                </button>
              )}
            </section>
          </div>
        </Drawer.Content>
      </Drawer.Portal>

      {/* 친구 초대 시트 — 열릴 때만 친구 조회 */}
      <BottomSheet open={pickerOpen} onOpenChange={setPickerOpen} title="초대할 친구">
        <InvitePickerContent
          conversationId={conversationId}
          memberIds={memberIds}
          canSetTitle={isDirect}
          onDone={() => {
            setPickerOpen(false);
            onOpenChange(false);
          }}
        />
      </BottomSheet>

      {/* 방 이름(개인 별명) 변경 시트 */}
      <BottomSheet open={aliasOpen} onOpenChange={setAliasOpen} title="채팅방 이름 변경">
        <AliasEditContent
          conversationId={conversationId}
          current={roomTitle}
          onDone={() => setAliasOpen(false)}
        />
      </BottomSheet>

      {/* 나가기 확인 */}
      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="채팅방 나가기"
        description="나가면 대화 목록에서 사라지고, 남은 멤버에게 나갔다고 표시됩니다."
        confirmLabel="나가기"
        cancelLabel="취소"
        tone="danger"
        loading={leave.isPending}
        onConfirm={() =>
          leave.mutate(conversationId, {
            onSuccess: () => {
              setLeaveOpen(false);
              onOpenChange(false);
              router.push(ROUTES.FRIENDS.LIST);
            },
            onError: () => toast.error("나가지 못했어요. 다시 시도해주세요"),
          })
        }
      />
    </Drawer.Root>
  );
}

// 내 개인 방 별명 편집 (나만 보임)
function AliasEditContent({
  conversationId,
  current,
  onDone,
}: {
  conversationId: string;
  current: string;
  onDone: () => void;
}) {
  const setAlias = useSetAlias(conversationId);
  const [value, setValue] = useState(current);

  const save = () => {
    setAlias.mutate(value, {
      onSuccess: onDone,
      onError: () => toast.error("이름을 바꾸지 못했어요"),
    });
  };

  return (
    <div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={50}
        placeholder="나만 보이는 방 이름"
        className="w-full rounded-lg bg-surface-muted px-4 py-3 text-[15px] text-text outline-none placeholder:text-text-disabled"
      />
      <p className="mt-1 px-1 text-[12px] text-text-disabled">
        이 이름은 나에게만 보여요. 비우면 기본 이름으로 돌아갑니다.
      </p>
      <button
        type="button"
        onClick={save}
        disabled={setAlias.isPending}
        className="mt-4 w-full rounded-lg bg-primary py-3 text-[15px] font-bold text-text-inverse disabled:opacity-40"
      >
        {setAlias.isPending ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}

// 친구 멀티선택 -> 초대. 성공 시 반환된 대화방으로 이동.
function InvitePickerContent({
  conversationId,
  memberIds,
  canSetTitle,
  onDone,
}: {
  conversationId: string;
  memberIds: string[];
  canSetTitle: boolean;
  onDone: () => void;
}) {
  const router = useRouter();
  const invite = useInvite(conversationId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [nameOpen, setNameOpen] = useState(false); // 새 단톡방 이름 입력 창

  const friends = useFriends().data?.friends ?? [];
  const memberSet = new Set(memberIds);
  const keyword = query.trim();
  // 이미 대화방에 있는 친구는 제외 + 이름 검색
  const candidates = friends
    .filter((f) => !memberSet.has(f.id))
    .filter((f) => (keyword ? matchName(f.name, keyword) : true));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleInvite = () => {
    if (selected.size === 0) return;
    invite.mutate(
      { userIds: [...selected], title: canSetTitle ? title : undefined },
      {
        onSuccess: (res) => {
          setNameOpen(false);
          onDone();
          router.push(ROUTES.CHAT.ROOM(res.conversationId));
        },
        onError: () => toast.error("초대하지 못했어요. 다시 시도해주세요"),
      },
    );
  };

  // 새 단톡방 생성(canSetTitle)이면 이름 입력 창을 먼저, 아니면 바로 초대
  const handlePrimary = () => {
    if (selected.size === 0) return;
    if (canSetTitle) setNameOpen(true);
    else handleInvite();
  };

  return (
    <div>
      <div className="mb-2">
        <SearchBar
          placeholder="이름으로 친구 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {candidates.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-text-disabled">
          {keyword ? "검색 결과가 없어요" : "초대할 수 있는 친구가 없어요"}
        </p>
      ) : (
        <ul className="flex max-h-[50vh] flex-col overflow-y-auto">
          {candidates.map((f) => {
            const name = f.name ?? "사용자";
            const checked = selected.has(f.id);
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => toggle(f.id)}
                  className="flex w-full items-center gap-3 py-2 active:opacity-70"
                >
                  <Avatar size="sm" src={f.avatarUrl ?? undefined} name={name} />
                  <span className="flex-1 text-left text-[15px] text-text">
                    {name}
                  </span>
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border ${
                      checked
                        ? "border-primary bg-primary text-text-inverse"
                        : "border-border"
                    }`}
                    aria-hidden
                  >
                    {checked ? "✓" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={handlePrimary}
        disabled={selected.size === 0 || invite.isPending}
        className="mt-4 w-full rounded-lg bg-primary py-3 text-[15px] font-bold text-text-inverse disabled:opacity-40"
      >
        {canSetTitle ? "다음" : "초대"}
        {selected.size > 0 ? ` (${selected.size})` : ""}
      </button>

      {/* 새 단톡방 이름 입력 창 (생성자만, 1회) */}
      <Modal
        open={nameOpen}
        onOpenChange={(o) => !invite.isPending && setNameOpen(o)}
        size="sm"
        title="단톡방 이름"
        description="이름을 정하면 모든 멤버에게 보여요. 비워두면 멤버 이름으로 표시됩니다."
        footer={
          <button
            type="button"
            onClick={handleInvite}
            disabled={invite.isPending}
            className="w-full rounded-lg bg-primary py-3 text-[15px] font-bold text-text-inverse disabled:opacity-40"
          >
            {invite.isPending ? "만드는 중..." : "단톡방 만들기"}
          </button>
        }
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={50}
          placeholder="예: 주말 모임"
          autoFocus
          className="w-full rounded-lg bg-surface-muted px-4 py-3 text-[15px] text-text outline-none placeholder:text-text-disabled"
        />
      </Modal>
    </div>
  );
}
