import LocationWithDate from "../LocationWithDate/LoactionWithDate";
import MissionWithNote from "../MissionWithNote/MissionWithNote";

interface InformationsContainerProps {
  invitationId: string;
}

export default function InformationsContainer({ invitationId }: InformationsContainerProps) {
  return (
    <div>
      <LocationWithDate invitationId={invitationId} />
      <MissionWithNote />
      <div>rsvp</div>
    </div>
  );
}
