import { Avatar, Icon } from "@wara/ui";

type Props = {
  participants: {
    participant: {
      id: string;
      userId: string;
      memberRole?: "HOST" | "GUEST";
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
    <div className="-mx-4 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden">
      <div className="flex w-max items-center gap-2 px-4 py-1">
        {sorted.map(({ participant, user }) => {
          const isHost = participant.memberRole === "HOST";
          return (
            <span key={participant.id} className="relative shrink-0">
              <Avatar
                src={
                  participant.userId === currentUserId
                    ? (currentUserProfileImageUrl ?? undefined)
                    : (user.profileImageUrl ?? undefined)
                }
                alt={user.name ?? user.nickname ?? ''}
                size="lg"
                name={user.name ?? user.nickname ?? undefined}
              />
              {isHost ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex size-4 items-center justify-center rounded-full bg-yellow-400 text-white ring-2 ring-surface">
                  <Icon name="crown" size="xs" color="currentColor" decorative />
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
