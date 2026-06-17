"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Avatar, Badge, Button, Icon, Modal } from "@wara/ui";
import type { BadgeTone } from "./InviteCard";
import type { ParticipantRsvp } from "./ParticipantList";
import { useUserProfile } from "@/hooks/useUsers";
import { getCommentAuthorName } from "@/domain/InvitationDetail/types";
import { createConversation } from "@/lib/api/conversations";
import { ROUTES } from "@/constants/routes";

const RSVP_META: Record<ParticipantRsvp, { label: string; tone: BadgeTone }> = {
  attending: { label: "참석", tone: "success" },
  undecided: { label: "미정", tone: "warning" },
  absent: { label: "불참", tone: "danger" },
  noResponse: { label: "미응답", tone: "neutral" },
};

export interface ParticipantProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** userId를 넘기면 내부에서 자동 fetch. name/handle/avatarUrl은 즉시 표시용 초기값 */
  userId?: string;
  name?: string;
  handle?: string;
  avatarUrl?: string;
  status?: ParticipantRsvp;
  isHost?: boolean;
  /** 동반 인원 수 */
  companionCount?: number;
  /** 요청사항 */
  requestPreview?: string;
  /** 자기소개 / 한 줄 메모 */
  bio?: string;
  /** 탈퇴(soft-deleted) 회원 — true면 정보/액션 숨기고 "탈퇴한 회원입니다"만 표시 */
  isWithdrawn?: boolean;
}

export function ParticipantProfileModal({
  open,
  onOpenChange,
  userId,
  name: nameProp,
  handle: handleProp,
  avatarUrl: avatarUrlProp,
  status,
  isHost = false,
  companionCount,
  requestPreview,
  bio,
  isWithdrawn = false,
}: ParticipantProfileModalProps) {
  const router = useRouter();
  // 탈퇴 회원은 프로필 조회 자체를 막아 잔여 정보 노출 방지
  const { data: fetched } = useUserProfile(isWithdrawn ? undefined : userId);
  const name = fetched ? getCommentAuthorName(fetched) : (nameProp ?? "");
  const handle = fetched?.nickname ?? handleProp;
  const avatarUrl = fetched?.profileImageUrl ?? avatarUrlProp;
  const rsvp = status ? RSVP_META[status] : null;

  const startChat = useMutation({
    mutationFn: (targetUserId: string) => createConversation(targetUserId),
    onSuccess: (data) => {
      onOpenChange(false);
      router.push(ROUTES.CHAT.ROOM(data.id));
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={
        <span>
          {name}
          {handle ? (
            <span className="ml-1.5 type-bodySmall font-normal text-text-muted">@{handle}</span>
          ) : null}
        </span>
      }
      hideTitle
      footer={
        userId && !isWithdrawn ? (
          <div className="flex gap-2">
            <Button
              size="lg"
              variant="secondary"
              className="flex-1 gap-2"
              onClick={() => {
                onOpenChange(false);
                router.push(ROUTES.FRIENDS.DETAIL(userId));
              }}
            >
              <Icon name="user" size="sm" color="currentColor" decorative />
              프로필 보기
            </Button>
            <Button
              size="lg"
              className="flex-1 gap-2"
              disabled={startChat.isPending}
              onClick={() => startChat.mutate(userId)}
            >
              <Icon name="message-circle" size="sm" color="currentColor" decorative />
              1:1 DM
            </Button>
          </div>
        ) : undefined
      }
    >
      {isWithdrawn ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <Avatar name="?" size="2xl" className="opacity-60 grayscale" />
          <p className="type-sectionTitle text-text-muted">탈퇴한 회원입니다</p>
        </div>
      ) : (
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar src={avatarUrl} name={name} size="2xl" />
        <div className="flex flex-col items-center gap-1.5">
          <p className="type-sectionTitle text-text">{name}</p>
          {handle ? (
            <p className="type-bodySmall font-normal text-text-muted">@{handle}</p>
          ) : null}
          <div className="flex items-center gap-1.5">
            {isHost ? <Badge tone="warning" size="sm">호스트</Badge> : null}
            {rsvp ? <Badge tone={rsvp.tone} size="sm">{rsvp.label}</Badge> : null}
          </div>
        </div>

        {bio ? (
          <div className="w-full rounded-lg bg-surface-muted px-4 py-3 text-left">
            <p className="type-bodySmall text-text-muted">{bio}</p>
          </div>
        ) : null}

        {companionCount && companionCount > 0 ? (
          <div className="flex items-center gap-2 type-bodySmall text-text-muted">
            <Icon name="users" size="sm" color="currentColor" decorative />
            <span>동반 {companionCount}명과 함께 참석</span>
          </div>
        ) : null}

        {requestPreview ? (
          <div className="flex w-full items-start gap-2 rounded-lg border border-border px-4 py-3 text-left">
            <Icon name="message-circle" size="sm" color="currentColor" decorative className="mt-0.5 shrink-0" />
            <p className="type-bodySmall text-text-muted">“{requestPreview}”</p>
          </div>
        ) : null}
      </div>
      )}
    </Modal>
  );
}
