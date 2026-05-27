import { Avatar } from "@/components/primitives/Avatar";

const MAX_VISIBLE = 6;

type Props = {
  participants: {
    participant: { id: string };
    user: { nickname: string | null; profileImageUrl: string | null };
  }[];
};

export default function ParticipantAvatarRow({ participants }: Props) {
  const visible = participants.slice(0, MAX_VISIBLE);
  const overflow = participants.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-2">
      {visible.map(({ participant, user }) => (
        <Avatar
          key={participant.id}
          src={user.profileImageUrl ?? undefined}
          alt={user.nickname ?? ""}
          size="md"
          initial={user.nickname?.[0]}
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
