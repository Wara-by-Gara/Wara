"use client";

import { useRouter } from "next/navigation";
import { TopAppBar, EmptyState } from "@wara/ui";
import { InviteCard } from "@/components/domain";
import { mobileMainScroll, stickyMainTop } from "@/lib/mobilePageLayout";
import { useHiddenInvitations } from "@/hooks/useInvitations";
import { useHideInvitation } from "@/hooks/useParticipants";
import { ROUTES } from "@/constants/routes";
import { getInvitationCoverImageUrl } from "@/domain/InvitationList/invitationListUtils";
import { formatInvitationEventDate } from "@/utils/formatInvitationEventDate";

export const HiddenInvitations = () => {
  const router = useRouter();
  const { data, isLoading } = useHiddenInvitations();
  const unhide = useHideInvitation();
  const invitations = data ?? [];

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-surface-muted">
      <TopAppBar
        className="absolute inset-x-0 top-0 z-30"
        title="숨긴 초대장"
        onBack={() => router.back()}
      />
      <main className={`relative z-10 ${mobileMainScroll} ${stickyMainTop}`}>
        {isLoading ? (
          <p className="py-10 text-center text-[14px] text-text-disabled">불러오는 중…</p>
        ) : invitations.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-page">
            <EmptyState
              icon="eye-off"
              title="숨긴 초대장이 없어요"
              description="초대장을 숨기면 여기서 되돌릴 수 있어요"
            />
          </div>
        ) : (
          <ul className="divide-y divide-border bg-surface">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 pr-page">
                <InviteCard
                  layout="horizontal"
                  imageUrl={getInvitationCoverImageUrl(inv) || undefined}
                  title={inv.title}
                  dateText={formatInvitationEventDate(inv.eventStartAt)}
                  locationText={inv.eventLocation?.placeName ?? inv.eventLocation?.address ?? ""}
                  onClick={() => router.push(ROUTES.INVITATIONS.DETAIL(inv.id))}
                  className="flex-1 min-w-0"
                />
                <button
                  type="button"
                  onClick={() => unhide.mutate({ invitationId: inv.id, isHidden: false })}
                  disabled={unhide.isPending}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[13px] font-bold text-text active:bg-surface-muted disabled:opacity-50"
                >
                  되돌리기
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};
