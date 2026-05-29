import type { getInvitation } from "@/lib/api/invitations";
import LocationWithDate from "../LocationWithDate/LocationWithDate";

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;

type Props = {
  invitation: Invitation;
  isHost: boolean;
  invitationId: string;
  voteResultsHref?: string;
};

export default function InformationsContainer({ invitation, isHost, invitationId, voteResultsHref }: Props) {
  return (
    <LocationWithDate invitation={invitation} isHost={isHost} invitationId={invitationId} voteResultsHref={voteResultsHref} />
  );
}
