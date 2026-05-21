import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/components/primitives/Badge";
import { InvitationInfoCard } from "./InvitationInfoCard";

const meta: Meta<typeof InvitationInfoCard> = {
  title: "Organisms/InvitationInfoCard",
  component: InvitationInfoCard,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "초대장 상세의 정보 섹션 1개 (일시/장소/호스트/RSVP/앨범/댓글/공지)." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof InvitationInfoCard>;

export const DateTime: Story = {
  args: {
    variant: "datetime",
    title: "2026년 5월 19일 화요일",
    time: "오후 7시",
    badge: <Badge variant="dday">D-3</Badge>,
  },
};
export const Location: Story = {
  args: { variant: "location", title: "와라 카페", description: "서울 마포구 와라로 12", chevron: true },
};
export const Host: Story = {
  args: { variant: "host", title: "김와라", description: "@wara_kim" },
};
export const RsvpSummary: Story = {
  args: { variant: "rsvp", title: "12명 참석 · 3명 미정", description: "전체 20명 중 응답 15명" },
};
export const AlbumPreview: Story = {
  args: { variant: "album", title: "사진 24장", description: "오늘 새 사진 2장이 올라왔어요", chevron: true },
};
export const CommentPreview: Story = {
  args: { variant: "comment", title: "댓글 5", description: "최근 — '기대돼요!'", chevron: true },
};
export const Notice: Story = {
  args: { variant: "notice", title: "주차 안내", description: "건물 지하 1층 무료" },
};
