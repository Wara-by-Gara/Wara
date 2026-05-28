"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { InvitationDetailSkeleton } from "@/components/organisms/Skeleton";
import { useAuthStore } from "@/stores/authStore";

import HostView from "./HostView";
import GuestView from "./GuestView";
import { useInvitationDetail } from "@/hooks/useInvitationDetail";

export default function InvitationDetailContainer({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);

  const { invitation, isLoading, isError, me, myParticipant, participantsData } =
    useInvitationDetail(invitationId);

  if (!hydrated || isLoading) {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" onBack={() => router.back()} />
        <div className="px-5 py-4"><InvitationDetailSkeleton /></div>
        <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" onBack={() => router.back()} />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Icon name="alert-triangle" size="xl" color="danger" decorative />
          <p className="text-[18px] font-bold text-text-primary">초대장을 불러오지 못했어요</p>
          <Button variant="outline" onClick={() => router.back()}>돌아가기</Button>
        </main>
        <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  const isHost = isLoggedIn && me?.id === invitation.userId;

  if (isHost) {
    return <HostView invitationId={invitationId} invitation={invitation} participantsData={participantsData} me={me} />;
  }

  return (
    <GuestView
      invitationId={invitationId}
      invitation={invitation}
      me={me}
      myParticipant={myParticipant}
      participantsData={participantsData}
    />
  );
}