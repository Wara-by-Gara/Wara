import type { Meta, StoryObj } from "@storybook/react";
import { CommentReplyItem } from "./CommentReplyItem";

const meta: Meta<typeof CommentReplyItem> = {
  title: "Organisms/CommentItem/CommentReplyItem",
  component: CommentReplyItem,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div
        style={{ width: 300 }}
        className="ml-11 rounded-2xl border border-border border-l-2 border-l-primary-soft bg-surface pl-3"
      >
        <Story />
      </div>
    ),
  ],
  args: {
    authorName: "김와라",
    authorAvatarUrl: "/profile-me.png",
    replyToName: "최하나",
    content: "건물 지하 1층 무료 주차 가능해요!",
    createdAt: "1시간 전",
    variant: "host",
  },
};
export default meta;
type Story = StoryObj<typeof CommentReplyItem>;

export const Default: Story = {};
export const Mine: Story = {
  args: {
    variant: "mine",
    authorName: "박미라",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=21",
    replyToName: "이지은",
    content: "저도 같이 갈게요!",
    createdAt: "5분 전",
    onMore: () => {},
  },
};

export const PhotoReply: Story = {
  args: {
    authorName: "이지은",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=24",
    replyToName: "김와라",
    content: "현장 사진이에요!",
    createdAt: "30분 전",
    imageUrl: "/invitation-cover-cake.png",
  },
};

export const PhotoReplyOnly: Story = {
  args: {
    authorName: "최하나",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=44",
    replyToName: "박미라",
    content: "",
    createdAt: "1시간 전",
    imageUrl: "/invitation-cover-cake.png",
  },
};
