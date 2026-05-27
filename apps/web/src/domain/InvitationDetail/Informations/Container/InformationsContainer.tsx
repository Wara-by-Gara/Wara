import type { getInvitation } from "@/lib/api/invitations";
import LocationWithDate from "../LocationWithDate/LocationWithDate";

type Invitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;

type Props = {
  invitation: Invitation;
  isHost: boolean;
  invitationId: string;
};

export default function InformationsContainer({ invitation, isHost, invitationId }: Props) {
  return (
    <LocationWithDate invitation={invitation} isHost={isHost} invitationId={invitationId} />
  );
}
