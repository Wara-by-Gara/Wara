import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { mockPhotos, mockComments } from "@/lib/mockData";
import { PhotoListModal } from "./PhotoListModal";

const meta: Meta = {
  title: "Organisms/PhotoListModal",
  parameters: {
    docs: {
      description: {
        component:
          "사진 그리드 → 개별 뷰어. 사진 리스트 탭 시 전체 목록 모달이 열리고, 개별 사진을 탭하면 PhotoViewer로 전환.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const mockModalPhotos = mockPhotos.map((p) => ({
  id: p.id,
  src: p.src,
  alt: "",
  authorName: p.authorName,
  authorAvatarUrl: p.authorAvatarUrl,
  createdAt: p.createdAt,
  likeCount: Math.floor(Math.random() * 20),
  liked: false,
  comments: mockComments.slice(0, 3).map((c) => ({
    id: c.id,
    authorName: c.authorName,
    authorAvatarUrl: c.authorAvatarUrl,
    content: c.content,
    createdAt: c.createdAt,
  })),
}));

const frame = (child: React.ReactNode) => (
  <div className="relative mx-auto h-[680px] w-[360px] overflow-hidden rounded-3xl border border-border bg-background">
    {child}
  </div>
);

/** 트리거 버튼을 눌러 모달을 열고, 사진을 탭하면 뷰어로 전환됩니다 */
const InteractiveDemo = () => {
  const [open, setOpen] = useState(false);
  return frame(
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface px-6">
      <p className="text-center text-[14px] text-text-secondary">
        아래 버튼을 눌러 사진 리스트 모달을 열어보세요
      </p>
      <Button onClick={() => setOpen(true)}>
        전체 사진 {mockModalPhotos.length}장 보기
      </Button>
      <PhotoListModal
        contained
        open={open}
        onOpenChange={setOpen}
        photos={mockModalPhotos}
        onPhotoLike={() => {}}
        onCommentSubmit={() => {}}
      />
    </div>,
  );
};

export const Default: Story = { render: () => <InteractiveDemo /> };

/** 사진이 없는 빈 상태 */
const EmptyDemo = () => {
  const [open, setOpen] = useState(false);
  return frame(
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface px-6">
      <Button onClick={() => setOpen(true)}>사진 목록 열기 (비어있음)</Button>
      <PhotoListModal
        contained
        open={open}
        onOpenChange={setOpen}
        photos={[]}
        title="전체 사진"
      />
    </div>,
  );
};

export const EmptyState: Story = { render: () => <EmptyDemo /> };

/** 처음부터 모달이 열려있는 상태 (그리드 확인용) */
const OpenGridDemo = () => {
  const [open, setOpen] = useState(true);
  return frame(
    <div className="relative h-full bg-surface">
      <PhotoListModal
        contained
        open={open}
        onOpenChange={setOpen}
        photos={mockModalPhotos}
        title={`전체 사진 ${mockModalPhotos.length}장`}
        onPhotoLike={() => {}}
        onCommentSubmit={() => {}}
      />
    </div>,
  );
};

export const GridOpen: Story = { render: () => <OpenGridDemo /> };
