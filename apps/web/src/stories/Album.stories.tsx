import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TopAppBar, Button, Icon, EmptyState } from "@wara/ui";
import { GalleryGrid, type GalleryPhoto } from "@/components/domain";
import { PhotoListModal, type PhotoListModalPhoto } from "@/components/domain/PhotoListModal";
import { PhotoViewer } from "@/components/domain/PhotoViewer";

const meta: Meta = {
  title: "Pages/Album",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

const PHOTOS: GalleryPhoto[] = Array.from({ length: 11 }, (_, i) => ({
  id: String(i),
  url: `https://picsum.photos/seed/album${i}/300/300`,
  alt: `사진 ${i + 1}`,
}));

export const Grid: Story = {
  render: () => (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <TopAppBar
        title="사진 앨범"
        onBack={() => {}}
        rightSlot={<Button size="sm" variant="secondary"><Icon name="share" size="sm" color="currentColor" decorative /> 공유</Button>}
      />
      <main className="flex-1 px-4 pb-28 pt-3">
        <p className="mb-3 type-bodySmall text-text-muted">참석한 게스트만 볼 수 있어요 · {PHOTOS.length}장</p>
        <GalleryGrid photos={PHOTOS} columns={3} onSelect={() => {}} />
      </main>
      <div className="sticky bottom-0 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <Button glow fullWidth size="lg">
          <Icon name="camera" size="sm" color="currentColor" decorative /> 사진 올리기
        </Button>
      </div>
    </div>
  ),
};

const LIST_PHOTOS: PhotoListModalPhoto[] = Array.from({ length: 9 }, (_, i) => ({
  id: String(i),
  src: `https://picsum.photos/seed/album${i}/400/400`,
  alt: `사진 ${i + 1}`,
  authorName: ["김민지", "이서연", "박도윤"][i % 3],
  createdAt: "방금 전",
  likeCount: i * 2,
  liked: i % 4 === 0,
}));

export const ListModal: Story = {
  name: "PhotoListModal",
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <div className="relative mx-auto h-[720px] w-full max-w-[440px] overflow-hidden bg-background">
        <button className="m-4 type-button text-link" onClick={() => setOpen(true)}>
          전체 사진 열기
        </button>
        <PhotoListModal
          open={open}
          onOpenChange={setOpen}
          contained
          photos={LIST_PHOTOS}
          onPhotoLike={() => {}}
        />
      </div>
    );
  },
};

export const Viewer: Story = {
  name: "PhotoViewer",
  render: () => (
    <div className="relative mx-auto flex h-[720px] w-full max-w-[440px] items-center justify-center bg-surface-muted">
      <PhotoViewer
        open
        contained
        variant="owner"
        src="https://picsum.photos/seed/viewer/600/900"
        authorName="이서연"
        createdAt="3분 전"
        likeCount={12}
        liked
        commentCount={3}
        commentsOpen
        comments={[
          { id: "1", authorName: "김민지", content: "사진 너무 예뻐요!", createdAt: "2분 전" },
          { id: "2", authorName: "박도윤", content: "잘 나왔다 ㅎㅎ", createdAt: "1분 전" },
        ]}
        onClose={() => {}}
        onLike={() => {}}
        onSave={() => {}}
        onCommentSubmit={() => {}}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <TopAppBar title="사진 앨범" onBack={() => {}} />
      <main className="flex flex-1 items-center justify-center">
        <EmptyState
          icon="images"
          title="아직 사진이 없어요"
          description="추억이 카메라롤에서 잠들지 않게, 사진을 올려보세요."
          action={<Button glow><Icon name="camera" size="sm" color="currentColor" decorative /> 사진 올리기</Button>}
        />
      </main>
    </div>
  ),
};
