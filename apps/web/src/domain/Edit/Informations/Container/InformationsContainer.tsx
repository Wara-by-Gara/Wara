"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationWithDate from "../LocationWithDate/LoactionWithDate";
import MissionWithNote from "../MissionWithNote/MissionWithNote";
import ShareModal from "@/domain/Edit/Informations/Container/Components/Share/ShareModal";
import { useCreateInvitation } from "@/hooks/useInvitations";
import { ROUTES } from "@/constants/routes";
import type { CreatedInvitation } from "@/lib/api/invitations";

// TODO: 폼 완성 후 실제 입력값으로 교체
const STUB_PAYLOAD = {
  title: "Summer Garden Soiree",
  description: "A lovely summer gathering",
  mainImageKey: "seed/invitations/inv01/main.jpg",
  eventStartAt: "2026-06-20T14:00:00Z",
};

export default function InformationsContainer() {
  const [createdInvitation, setCreatedInvitation] = useState<CreatedInvitation | null>(null);
  const router = useRouter();
  const { mutate: createInvitation, isPending } = useCreateInvitation();

  const handleCreate = () => {
    createInvitation(STUB_PAYLOAD, {
      onSuccess: (data) => setCreatedInvitation(data),
    });
  };

  return (
    <>
      <div>
        <LocationWithDate />
        <MissionWithNote />
        <button onClick={handleCreate} disabled={isPending}>
          {isPending ? "생성 중..." : "button"}
        </button>
      </div>

      {createdInvitation && (
        <ShareModal
          invitation={createdInvitation}
          onGoToGatherings={() => router.push(ROUTES.INVITATIONS.DETAIL(createdInvitation.id))}
        />
      )}
    </>
  );
}
