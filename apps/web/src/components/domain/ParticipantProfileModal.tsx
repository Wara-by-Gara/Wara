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
}: ParticipantProfileModalProps) {
  const router = useRouter();
  const { data: fetched } = useUserProfile(userId);
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
        userId ? (
          <div className="flex gap-2">
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              className="gap-2"
              onClick={() => {
                onOpenChange(false);
                router.push(ROUTES.FRIENDS.DETAIL(userId));
              }}
            >
              <Icon name="user" size="sm" color="currentColor" decorative />
              프로필 보기
            </Button>
            <Button
              fullWidth
              size="lg"
              className="gap-2"
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
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar src={avatarUrl} name={name} size="2xl" />
        <div className="flex flex-col items-center gap-1.5">
          <p className="type-sectionTitle text-text">
            {name}
            {handle ? (
              <span className="ml-1.5 type-bodySmall font-normal text-text-muted">@{handle}</span>
            ) : null}
          </p>
          <div className="flex items-center gap-1.5">
            {isHost ? <Badge tone="warning" size="sm">호스트</Badge> : null}
            {rsvp ? <Badge tone={rsvp.tone} size="sm">{rsvp.label}</Badge> : null}
          </div>
        </div>

        {bio ? (
          <div className="w-full rounded-lg bg-background-soft px-4 py-3 text-left">
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
    </Modal>
  );
}
