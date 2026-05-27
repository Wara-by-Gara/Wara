import type { Meta, StoryObj } from "@storybook/react";
import { DateVote } from "./DateVote";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof DateVote> = {
  title: "Pages/23 DateVote(날짜 투표)/Page",
  component: DateVote,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof DateVote>;

/** 투표 전 — 날짜·시간 슬롯에 ○△× 응답 선택 가능 */
export const GuestVoting: Story = { args: { state: "guestVoting" } };

/** 투표 완료 — 이미 응답한 상태, 마감 전까지 언제든 수정 가능 */
export const GuestVoted: Story = { args: { state: "guestVoted" } };

/** 호스트 뷰 — 투표 참여 + 미투표자 관리 + 리마인더 + 조기 종료 */
export const HostView: Story = { args: { state: "hostView" } };

/** 투표 마감 (공개) — 누가 무슨 응답을 했는지 이름과 함께 표시 */
export const ResultsPublic: Story = { args: { state: "resultsPublic" } };

/** 투표 마감 (비공개) — 이름 없이 ○△× 통계만 표시 */
export const ResultsPrivate: Story = { args: { state: "resultsPrivate" } };

/** 날짜 확정 완료 — 최다 응답 슬롯이 확정되어 전체 참여자에게 안내 */
export const Confirmed: Story = { args: { state: "confirmed" } };
