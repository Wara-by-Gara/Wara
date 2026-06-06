import type { getInvitation } from "@/lib/api/invitations";

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;

export function getInvitationDetailCover(invitation: Invitation) {
  const hasGif = invitation.mainCoverType === "gif";
  const hasImage =
    invitation.mainCoverType === "image" &&
    !!invitation.mainImageUrl &&
    !(invitation.mainImageKey?.includes("defaults/") ?? false);

  return {
    hasGif,
    hasImage,
    imageUrl: hasImage ? (invitation.mainImageUrl ?? undefined) : undefined,
    gifUrl: hasGif ? (invitation.mainGifUrl ?? undefined) : undefined,
    backdropImageUrl: hasImage ? (invitation.mainImageUrl ?? undefined) : undefined,
    backdropGifUrl: hasGif ? (invitation.mainGifUrl ?? undefined) : undefined,
    variant: (hasGif || hasImage ? "image" : "color") as "image" | "color",
  };
}
