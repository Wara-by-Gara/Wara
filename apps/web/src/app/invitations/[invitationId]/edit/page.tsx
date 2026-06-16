"use client";

import { useParams, useRouter } from "next/navigation";
import { useInvitation } from "@/hooks/useInvitations";
import InvitationCreateContainer from "@/domain/InvitationCreate/Container/InvitationCreateContainer";
import { ROUTES } from "@/constants/routes";

export default function InvitationEditPage() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const router = useRouter();
  const { data: invitation, isLoading, isError } = useInvitation(invitationId);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-page text-center">
        <p className="text-[16px] font-semibold text-text">초대장을 불러올 수 없어요</p>
        <button
          type="button"
          onClick={() => router.push(ROUTES.HOME)}
          className="text-[14px] text-primary"
        >
          홈으로
        </button>
      </div>
    );
  }

  return <InvitationCreateContainer editInvitation={invitation} />;
}
