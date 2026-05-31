import { Avatar } from "@/components/primitives/Avatar";
import { getParticipantDisplayName } from "@/domain/InvitationDetail/types";

type Props = {
  participants: {
    participant: {
      id: string;
      userId: string;
      memberRole?: "HOST" | "GUEST";
      displayName?: string | null;
    };
    user: { name: string | null; nickname: string | null; profileImageUrl: string | null };
  }[];
  currentUserId?: string | null;
  currentUserProfileImageUrl?: string | null;
};

export default function ParticipantAvatarRow({
  participants,
  currentUserId,
  currentUserProfileImageUrl,
}: Props) {
  const sorted = [...participants].sort((a, b) => {
    if (a.participant.memberRole === "HOST") return -1;
    if (b.participant.memberRole === "HOST") return 1;
    return 0;
  });

  return (
    <div className="-mx-4 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max items-center gap-2 px-4 py-1">
        {sorted.map(({ participant, user }) => {
          const displayName = getParticipantDisplayName(participant, user, "");
          return (
            <Avatar
              key={participant.id}
              src={
                participant.userId === currentUserId
                  ? (currentUserProfileImageUrl ?? undefined)
                  : (user.profileImageUrl ?? undefined)
              }
              alt={displayName}
              size="lg"
              name={user.name ?? user.nickname ?? undefined}
              host={participant.memberRole === "HOST"}
            />
          );
        })}
      </div>
    </div>
  );
}
