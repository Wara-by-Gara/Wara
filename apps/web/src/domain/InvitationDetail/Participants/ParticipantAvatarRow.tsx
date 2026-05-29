import { Avatar } from "@/components/primitives/Avatar";

const MAX_VISIBLE = 6;

type Props = {
  participants: {
    participant: { id: string; userId: string; memberRole?: "HOST" | "GUEST" };
    user: { nickname: string | null; profileImageUrl: string | null };
  }[];
  currentUserId?: string | null;
  currentUserProfileImageUrl?: string | null;
};

export default function ParticipantAvatarRow({
  participants,
  currentUserId,
  currentUserProfileImageUrl,
}: Props) {
  const visible = participants.slice(0, MAX_VISIBLE);
  const overflow = participants.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-2">
      {visible.map(({ participant, user }) => (
        <Avatar
          key={participant.id}
          src={
            participant.userId === currentUserId
              ? (currentUserProfileImageUrl ?? undefined)
              : (user.profileImageUrl ?? undefined)
          }
          alt={user.nickname ?? ""}
          size="md"
          initial={user.nickname?.[0]}
          host={participant.memberRole === "HOST"}
        />
      ))}
      {overflow > 0 && (
        <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-[13px] font-semibold text-text-secondary">
          +{overflow}
        </div>
      )}
    </div>
  );
}
