"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Button } from "@wara/ui";
import { TopAppBar } from "@wara/ui";
import { InvitationDetailSkeleton } from "@/components/domain/Skeleton";
import { useAuthStore } from "@/stores/authStore";

import HostView from "./HostView";
import GuestView from "./GuestView";
import { AccessGate, accessGateKey } from "../AccessGate";
import { useInvitationDetail } from "@/hooks/useInvitationDetail";

export default function InvitationDetailContainer({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const { isLoggedIn, hydrated } = useAuthStore();
  const [unlocked, setUnlocked] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(accessGateKey(invitationId)) === "1",
  );

  const { invitation, isLoading, isError, me, myParticipant, participantsData } =
    useInvitationDetail(invitationId);

  if (!hydrated || isLoading) {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" onBack={() => router.back()} />
        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-page pb-6 pt-2">
          <InvitationDetailSkeleton />
        </main>
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" onBack={() => router.back()} />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-page text-center">
          <Icon name="alert-triangle" size="xl" color="danger" decorative />
          <p className="text-[18px] font-bold text-text">초대장을 불러오지 못했어요</p>
          <Button variant="secondary" onClick={() => router.back()}>돌아가기</Button>
        </main>
      </div>
    );
  }

  // 호스트 판정은 참가자 role 기준 (권한 위임 후 ex-host가 GuestView로 전환되어 RSVP 가능).
  // userId 비교는 로딩 중 깜빡임 방지용 fast-path (위임 시 userId도 함께 이동하므로 일관).
  const isHost =
    myParticipant?.memberRole === 'HOST' ||
    (isLoggedIn && me?.id === invitation.userId);

  if (isHost) {
    return <HostView invitationId={invitationId} invitation={invitation} participantsData={participantsData} />;
  }

  // 입장 비밀번호 게이트 — 호스트·기존 참가자는 통과, 그 외엔 검증 전까지 차단
  if (invitation.hasPassword && !myParticipant && !unlocked) {
    return <AccessGate invitationId={invitationId} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <GuestView
      invitationId={invitationId}
      invitation={invitation}
      me={me}
      participantsData={participantsData}
    />
  );
}