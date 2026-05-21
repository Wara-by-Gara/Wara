//종합 컨테이너

import InformationsContainer from '../Informations/Container/InformationsContainer';
import InvitationCardContainer from '../InvitationCard/Container/InvitationCardContainer';
import PhotoWithFeedbackContainer from '../PhotoWithFeedback/Container/PhotoWithFeedbackContainer';
import { InvitationDetailProps } from '../types';

export default function InvitationDetailContainer({
  invitationId,
}: InvitationDetailProps) {
  return (
    <div>
      <div className="flex flex-col md:flex-row bg-white mx-10 mt-12 rounded-lg overflow-hidden">
        <InvitationCardContainer invitationId={invitationId} />
        <InformationsContainer />
      </div>
      <PhotoWithFeedbackContainer invitationId={invitationId} />
    </div>
  );
}
