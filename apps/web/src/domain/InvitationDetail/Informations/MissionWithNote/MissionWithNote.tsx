"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import ShareBottomSheet from "../ShareBottomSheet";

export default function MissionWithNote() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div>
      <div>mission</div>
      <div>note</div>
      <div>
      <button type="button" onClick={() => router.push(ROUTES.INVITATIONS.PARTICIPANTS(invitationId))}>
        참석자 보기
      </button></div>
      <div>
      <button type="button" onClick={() => setShareOpen(true)}>
        공유하기
      </button></div>

      <ShareBottomSheet
        invitationId={invitationId}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </div>
  );
}
