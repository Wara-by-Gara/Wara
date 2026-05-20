//종합 컨테이너

import InformationsContainer from '../Informations/Container/InformationsContainer';
import InvitationCardContainer from '../InvitationCard/Container/InvitationCardContainer';
import PhotoWithFeedbackContainer from '../PhotoWithFeedback/Container/PhotoWithFeedbackContainer';

export default function InvitationDetailContainer() {
  return (
    <div>
      <div>
        <InvitationCardContainer />
        <InformationsContainer />
      </div>
      <PhotoWithFeedbackContainer />
    </div>
  );
}
