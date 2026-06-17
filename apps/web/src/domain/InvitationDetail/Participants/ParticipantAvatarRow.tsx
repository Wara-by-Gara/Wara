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
  /** 아바타 클릭 시 프로필 모달 등을 띄우기 위한 콜백 */
  onSelect?: (info: { userId: string; name?: string; avatarUrl?: string }) => void;
};

export default function ParticipantAvatarRow({
  participants,
  currentUserId,
  currentUserProfileImageUrl,
  onSelect,
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
          const avatarUrl =
            participant.userId === currentUserId
              ? (currentUserProfileImageUrl ?? undefined)
              : (user.profileImageUrl ?? undefined);
          const name = user.name ?? user.nickname ?? undefined;
          return (
            <button
              key={participant.id}
              type="button"
              aria-label={name ?? "참석자"}
              onClick={() =>
                onSelect?.({ userId: participant.userId, name, avatarUrl })
              }
              className="relative shrink-0 rounded-full transition-transform active:scale-95"
            >
              <Avatar src={avatarUrl} alt={name ?? ''} size="lg" name={name} />
              {isHost ? (
                <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-4 items-center justify-center rounded-full bg-yellow-400 text-white ring-2 ring-surface">
                  <Icon name="crown" size="xs" color="currentColor" decorative />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
