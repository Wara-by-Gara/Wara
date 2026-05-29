import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Comments } from "./Comments";
import { CommentItem } from "@/components/organisms/CommentItem";
import { CommentInputBar } from "@/components/organisms/CommentInputBar";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { mockComments } from "@/lib/mockData";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof Comments> = {
  title: "Pages/15 Comments/Page",
  component: Comments,
  parameters: pageStoryParameters,
  args: { invitationId: "01JXXXXXXXXXXXXXXXXXXXXXXXXX" },
};
export default meta;
type Story = StoryObj<typeof Comments>;

export const Default: Story = {};

function CommentsWithLikeCountPage() {
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setLikes((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title={`댓글 ${mockComments.length}`} />
      <main className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
        {mockComments.map((c) => (
          <CommentItem
            key={c.id}
            authorName={c.authorName}
            authorAvatarUrl={c.authorAvatarUrl}
            content={c.content}
            createdAt={c.createdAt}
            variant={c.variant}
            likeCount={c.likeCount !== undefined
              ? c.likeCount + (likes[c.id] ? 1 : 0)
              : undefined}
            liked={!!likes[c.id]}
            onLike={() => toggle(c.id)}
            onReply={() => {}}
            replies={c.replies?.map((r) => ({
              ...r,
              likeCount: r.likeCount !== undefined
                ? r.likeCount + (likes[r.id] ? 1 : 0)
                : undefined,
              liked: !!likes[r.id],
              onLike: () => toggle(r.id),
            }))}
          />
        ))}
      </main>
      <div className="shrink-0">
        <CommentInputBar placeholder="댓글 남기기" onSubmit={() => {}} />
      </div>
    </div>
  );
}

export const WithLikeCount: Story = {
  parameters: {
    ...pageStoryParameters,
    docs: { description: { story: "댓글 좋아요 카운트 표시 (♥N) — 좋아요 버튼 탭 시 토글" } },
  },
  render: () => <CommentsWithLikeCountPage />,
};
