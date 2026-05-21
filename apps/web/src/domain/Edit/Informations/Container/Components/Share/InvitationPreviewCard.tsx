import type { CreatedInvitation } from "@/lib/api/invitations";

interface Props {
  invitation: CreatedInvitation;
}

export default function InvitationPreviewCard({ invitation }: Props) {
  const formattedDate = invitation.eventStartAt
    ? new Date(invitation.eventStartAt)
        .toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    : null;

  return (
    <div className="relative h-56 bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50 flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-[10px] tracking-[0.2em] text-wara-label uppercase mb-2 font-sans">
          You&apos;re Invited To
        </p>
        <h2 className="font-serif text-xl text-wara-body font-semibold leading-snug mb-3">
          {invitation.title}
        </h2>
        {formattedDate && (
          <p className="text-xs text-wara-label font-medium">{formattedDate}</p>
        )}
      </div>
    </div>
  );
}
