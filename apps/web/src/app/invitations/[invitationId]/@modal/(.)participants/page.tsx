import ParticipantsContainer from "@/domain/InvitationDetail/Participants/ParticipantsContainer";

// 상세 페이지(/invitations/[id])에서 참가자로 이동 시 모달로 가로챔.
// 새로고침·직접 진입 시엔 participants/page.tsx(전체 페이지)가 렌더된다.
export default function ParticipantsInterceptModal() {
  return <ParticipantsContainer />;
}
