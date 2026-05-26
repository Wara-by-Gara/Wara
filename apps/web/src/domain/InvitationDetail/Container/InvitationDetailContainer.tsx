//종합 컨테이너

import InformationsContainer from '../Informations/Container/InformationsContainer';
import InvitationCardContainer from '../InvitationCard/Container/InvitationCardContainer';
import PhotoWithFeedbackContainer from '../PhotoWithFeedback/Container/PhotoWithFeedbackContainer';
import { InvitationDetailProps } from '../types';

export default function InvitationDetailContainer({
  invitationId,
}: InvitationDetailProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-6">
      <InvitationCardContainer invitationId={invitationId} />
      <InformationsContainer invitationId={invitationId} />
      <PhotoWithFeedbackContainer invitationId={invitationId} />
    </div>
  );
}
