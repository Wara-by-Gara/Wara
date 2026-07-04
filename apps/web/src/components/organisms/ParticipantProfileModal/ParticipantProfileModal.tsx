"use client";

import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { Badge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { Modal, ModalOverlay, ModalPortal, ModalPrimitive } from "@/components/molecules/Modal";
import { cn } from "@/lib/cn";
import type { BadgeProps } from "@/components/primitives/Badge";
import { useUserProfile } from "@/hooks/useUsers";
import { getCommentAuthorName } from "@/domain/InvitationDetail/types";

export type ParticipantRsvp = "attending" | "maybe" | "declined" | "noResponse";

const RSVP_LABEL: Record<ParticipantRsvp, { label: string; variant: BadgeProps["variant"] }> = {
  attending: { label: "참석", variant: "attending" },
  maybe: { label: "미정", variant: "maybe" },
  declined: { label: "불참", variant: "declined" },
  noResponse: { label: "미응답", variant: "noResponse" },
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
  /** Storybook 베젤 등 부모(relative) 안에 맞출 때 */
  contained?: boolean;
  /** 1:1 DM 버튼 콜백 */
  onDm?: () => void;
}

export const ParticipantProfileModal = ({
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
  contained = false,
  onDm,
}: ParticipantProfileModalProps) => {
  const { data: fetched } = useUserProfile(userId);
  const name = fetched ? getCommentAuthorName(fetched) : (nameProp ?? '');
  const handle = fetched?.nickname ?? handleProp;
  const avatarUrl = fetched?.profileImageUrl ?? avatarUrlProp;
  const rsvp = status ? RSVP_LABEL[status] : null;

  const overlayClass = cn(
    "z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in",
    contained ? "absolute inset-0" : "fixed inset-0",
  );
  const contentClass = cn(
    "z-50 flex w-[calc(100%-40px)] max-w-sm flex-col overflow-hidden rounded-3xl bg-surface shadow-xl focus:outline-none",
    "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
    contained ? "absolute" : "fixed",
  );

  const modalBody = (
    <>
      <ModalOverlay className={overlayClass} />
      <ModalPrimitive.Content className={contentClass} aria-describedby={undefined}>
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="닫기"
          className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-black/10 text-text-secondary hover:bg-black/20 transition-colors duration-150"
        >
          <Icon name="x" size="sm" color="currentColor" decorative />
        </button>

        {/* 상단 배경 그라데이션 + 아바타 */}
        <div className="relative flex flex-col items-center bg-gradient-to-b from-primary-soft to-surface px-5 pb-4 pt-10">
          <Avatar
            src={avatarUrl}
            alt={name}
            size="xl"
            name={name}
            className={cn("ring-4 ring-surface", isHost && "ring-yellow-200")}
          />
          <div className="mt-3 flex flex-col items-center gap-1.5">
            <ModalPrimitive.Title className="text-[20px] font-bold text-text-primary">
              {name}
              {handle ? (
                <span className="ml-1.5 text-[14px] font-normal text-text-tertiary">@{handle}</span>
              ) : null}
            </ModalPrimitive.Title>
            <div className="flex items-center gap-1.5">
              {isHost ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-0.5 text-[12px] font-bold text-yellow-500">
                  <Icon name="crown" size="xs" color="currentColor" decorative /> 호스트
                </span>
              ) : null}
              {rsvp ? <Badge variant={rsvp.variant} size="sm">{rsvp.label}</Badge> : null}
            </div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="flex flex-col gap-3 px-5 py-4">
          {bio ? (
            <div className="rounded-2xl bg-background-soft px-4 py-3">
              <p className="text-[14px] text-text-secondary">{bio}</p>
            </div>
          ) : null}

          {companionCount && companionCount > 0 ? (
            <div className="flex items-center gap-2 text-[14px] text-text-secondary">
              <Icon name="users" size="sm" color="inactive" decorative />
              <span>동반 {companionCount}명과 함께 참석</span>
            </div>
          ) : null}

          {requestPreview ? (
            <div className="flex items-start gap-2 rounded-2xl border border-border px-4 py-3">
              <Icon name="message-circle" size="sm" color="inactive" decorative className="mt-0.5 shrink-0" />
              <p className="text-[14px] text-text-secondary">&ldquo;{requestPreview}&rdquo;</p>
            </div>
          ) : null}
        </div>

        {/* DM 버튼 */}
        <div className="border-t border-border px-5 py-4">
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              onDm?.();
              onOpenChange(false);
            }}
            className="gap-2"
          >
            <Icon name="message-circle" size="sm" color="currentColor" decorative />
            1:1 DM 보내기
          </Button>
        </div>
      </ModalPrimitive.Content>
    </>
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {contained ? modalBody : <ModalPortal>{modalBody}</ModalPortal>}
    </Modal>
  );
};
