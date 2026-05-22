import type { Meta, StoryObj } from "@storybook/react";
import { useState, type ReactNode } from "react";
import { mockComments } from "@/lib/mockData";
import { PhotoViewer } from "./PhotoViewer";

const meta: Meta<typeof PhotoViewer> = {
  title: "Organisms/PhotoViewer",
  component: PhotoViewer,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "DESIGN.md §24.3. 사진 뷰어 모달 — 댓글 버튼 탭 시 목록+입력." } },
  },
  args: {
    src: "/invitation-cover-cake.png",
    authorName: "김와라",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=18",
    createdAt: "오늘 19:42",
    likeCount: 12,
    commentCount: mockComments.length,
    comments: mockComments.slice(0, 4),
    onLike: () => {},
    onCommentSubmit: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof PhotoViewer>;

const frame = (child: ReactNode) => (
  <div className="relative mx-auto h-[680px] w-[360px] overflow-hidden rounded-3xl border border-border bg-background">
    {child}
  </div>
);

export const Default: Story = {
  render: (args) =>
    frame(<PhotoViewer {...args} open contained onClose={() => {}} />),
  args: {
    open: true,
    onClose: () => {},
    onSave: () => {},
    onShare: () => {},
  },
};

export const Liked: Story = {
  render: Default.render,
  args: { ...Default.args, liked: true, likeCount: 13 },
};

export const Owner: Story = {
  render: Default.render,
  args: { ...Default.args, variant: "owner", onMore: () => {} },
};

export const CommentsOpen: Story = {
  render: Default.render,
  args: {
    ...Default.args,
    variant: "owner",
    liked: true,
    commentsOpen: true,
    onMore: () => {},
  },
};

export const OwnerMenuDemo: Story = {
  render: function OwnerMenuDemo(args) {
    const [open, setOpen] = useState(true);
    return frame(
      <PhotoViewer
        {...args}
        open={open}
        contained
        variant="owner"
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        onMore={() => {}}
      />,
    );
  },
};

export const Loading: Story = {
  render: Default.render,
  args: { ...Default.args, variant: "loading", src: undefined },
};

export const ErrorState: Story = {
  render: Default.render,
  args: { ...Default.args, variant: "error", src: undefined },
};
