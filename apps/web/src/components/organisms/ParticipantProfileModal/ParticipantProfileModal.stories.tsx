import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { ParticipantProfileModal } from "./ParticipantProfileModal";

const meta: Meta<typeof ParticipantProfileModal> = {
  title: "Organisms/ParticipantProfileModal",
  component: ParticipantProfileModal,
  parameters: {
    docs: {
      description: {
        component: "참석자 프로필 확대 모달. 아바타 탭 시 표시. 1:1 DM 버튼 포함.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ParticipantProfileModal>;

const frame = (child: React.ReactNode) => (
  <div className="relative mx-auto h-[680px] w-[360px] overflow-hidden rounded-3xl border border-border bg-background">
    {child}
  </div>
);

const Demo = (props: Omit<React.ComponentProps<typeof ParticipantProfileModal>, "open" | "onOpenChange">) => {
  const [open, setOpen] = useState(false);
  return frame(
    <div className="flex h-full items-center justify-center bg-surface px-6">
      <Button onClick={() => setOpen(true)}>프로필 모달 열기</Button>
      <ParticipantProfileModal
        {...props}
        contained
        open={open}
        onOpenChange={setOpen}
        onDm={() => alert("DM 보내기")}
      />
    </div>,
  );
};

export const Attending: Story = {
  render: () => (
    <Demo
      name="박미라"
      avatarUrl="https://i.pravatar.cc/80?img=21"
      status="attending"
      bio="사진 찍는 걸 좋아해요 📸"
      requestPreview="조금 늦을 수도 있어요"
    />
  ),
};

export const Host: Story = {
  render: () => (
    <Demo
      name="김와라"
      avatarUrl="https://i.pravatar.cc/80?img=18"
      status="attending"
      isHost
      bio="와라의 생일 파티 주최자입니다 🎂"
    />
  ),
};

export const WithCompanion: Story = {
  render: () => (
    <Demo
      name="정민지"
      avatarUrl="https://i.pravatar.cc/80?img=49"
      status="attending"
      companionCount={2}
      requestPreview="친구 2명과 함께 갑니다!"
    />
  ),
};

export const Maybe: Story = {
  render: () => (
    <Demo
      name="오현우"
      avatarUrl="https://i.pravatar.cc/80?img=60"
      status="maybe"
      requestPreview="회사 일정 보고 다시 알려드릴게요"
    />
  ),
};

export const NoAvatar: Story = {
  render: () => (
    <Demo
      name="윤지호"
      status="attending"
    />
  ),
};

/** 처음부터 모달이 열려있는 상태 (레이아웃 확인용) */
const OpenDemo = () => {
  const [open, setOpen] = useState(true);
  return frame(
    <div className="relative h-full bg-surface">
      <ParticipantProfileModal
        contained
        open={open}
        onOpenChange={setOpen}
        name="이지은"
        avatarUrl="https://i.pravatar.cc/80?img=24"
        status="attending"
        bio="맛있는 거 먹으러 가요!"
        requestPreview="기대돼요! 곧 봬요 ✨"
        onDm={() => {}}
      />
    </div>,
  );
};

export const OpenState: Story = { render: () => <OpenDemo /> };
