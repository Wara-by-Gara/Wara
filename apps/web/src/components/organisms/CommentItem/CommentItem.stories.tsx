import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "@/components/primitives/Textarea";
import { CommentItem } from "./CommentItem";

const meta: Meta<typeof CommentItem> = {
  title: "Organisms/CommentItem",
  component: CommentItem,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "DESIGN.md §25. 댓글 1개." } } },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }} className="rounded-2xl border border-border bg-surface">
        <Story />
      </div>
    ),
  ],
  args: {
    authorName: "박미라",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=21",
    createdAt: "3분 전",
    content: "기대돼요! 곧 봬요 ✨",
  },
};
export default meta;
type Story = StoryObj<typeof CommentItem>;

export const Default: Story = {};
export const Mine: Story = { args: { variant: "mine", onMore: () => {} } };
export const Host: Story = { args: { variant: "host" } };
export const Deleted: Story = { args: { variant: "deleted", content: "" } };
export const Reported: Story = { args: { variant: "reported", content: "" } };
export const Editing: Story = {
  args: {
    variant: "editing",
    editingSlot: <Textarea defaultValue="수정 중인 댓글" />,
  },
};

export const WithReplies: Story = {
  args: {
    authorName: "최하나",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=44",
    content: "주차장 위치 알려주실 수 있나요?",
    createdAt: "2시간 전",
    onReply: () => {},
    onMore: () => {},
    replies: [
      {
        id: "r1",
        authorName: "김와라",
        authorAvatarUrl: "/profile-me.png",
        replyToName: "최하나",
        content: "건물 지하 1층 무료 주차 가능해요!",
        createdAt: "1시간 전",
        variant: "host",
      },
      {
        id: "r2",
        authorName: "최하나",
        authorAvatarUrl: "https://i.pravatar.cc/80?img=44",
        replyToName: "김와라",
        content: "알려주셔서 감사해요!",
        createdAt: "45분 전",
      },
    ],
  },
};

