import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/primitives/Button";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Organisms/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "DESIGN.md §27. 감성 문구 + CTA, '데이터 없음' 금지." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }} className="rounded-3xl border border-border bg-surface">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoInvitation: Story = {
  args: {
    icon: "ticket",
    title: "아직 만든 초대장이 없어요",
    description: "첫 모임을 Wara로 초대해보세요",
    action: <Button size="md">초대장 만들기</Button>,
  },
};
export const NoParticipants: Story = {
  args: { icon: "users-round", title: "아직 참석자가 없어요", description: "초대 링크를 공유해 친구들을 불러보세요" },
};
export const NoComments: Story = {
  args: { icon: "message-circle", title: "댓글이 아직 없어요", description: "첫 댓글을 남겨보세요" },
};
export const NoPhotos: Story = {
  args: { icon: "retro-camera", title: "사진이 아직 없어요", description: "모임의 첫 사진을 올려보세요" },
};
export const NoNotifications: Story = {
  args: { icon: "bell", title: "새 알림이 없어요", description: "초대장 활동이 생기면 알려드릴게요" },
};
export const NoSearchResult: Story = {
  args: { icon: "search", title: "검색 결과가 없어요", description: "다른 키워드로 검색해보세요" },
};
export const NoLocationResult: Story = {
  args: { icon: "map-pin", title: "장소를 찾지 못했어요", description: "주소를 직접 입력할 수도 있어요" },
};
export const PermissionRequired: Story = {
  args: {
    icon: "lock",
    title: "권한이 필요해요",
    description: "사진을 모으려면 앨범 접근 권한이 필요해요",
    action: <Button>권한 허용하기</Button>,
  },
};
export const LoginRequired: Story = {
  args: {
    icon: "user-round-cog",
    title: "로그인이 필요해요",
    description: "로그인하면 더 많은 기능을 사용할 수 있어요",
    action: <Button>로그인</Button>,
  },
};
