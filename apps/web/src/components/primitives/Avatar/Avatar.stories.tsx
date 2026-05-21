import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarGroup } from "./Avatar";

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Radix Avatar 기반. 이미지가 없을 때는 키 기반 파스텔 그라데이션 + 이니셜 fallback. `host` prop으로 crown 배지 표시.",
      },
    },
  },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {
  args: {
    src: "https://i.pravatar.cc/120?img=12",
    alt: "김와라",
  },
};

export const Initial: Story = {
  args: { alt: "김와라", initial: "와" },
};

export const WithGradient: Story = {
  args: { alt: "김와라", initial: "와", size: "lg" },
  parameters: {
    docs: {
      description: {
        story:
          "이미지가 없으면 alt/initial 키에서 stable한 파스텔 그라데이션을 자동 생성합니다. 맨 왼쪽은 host, 맨 오른쪽은 추가 인원 수(+N) 표시.",
      },
    },
  },
  render: () => (
    <div className="w-[280px] max-w-full">
      <AvatarGroup variant="separated" scrollable>
        <Avatar size="lg" alt="김현제" initial="김" host />
        <Avatar size="lg" alt="윤숙희" initial="윤" />
        <Avatar size="lg" alt="최우진" initial="최" />
        <Avatar size="lg" alt="김민성" initial="김" />
        <Avatar size="lg" alt="박수훈" initial="박" />
        <Avatar
          size="lg"
          initial="+12"
          className="bg-pink-100 text-[11px] font-bold text-pink-600"
        />
      </AvatarGroup>
    </div>
  ),
};

export const IconFallback: Story = {
  args: { alt: "Kang Esther" },
};

export const Host: Story = {
  args: { alt: "김와라", initial: "와", host: true, size: "lg" },
  parameters: {
    docs: { description: { story: "HOST 표시 — 우측 하단에 crown 배지가 표시됩니다." } },
  },
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="md" alt="이하림" initial="이" host />
      <Avatar size="lg" alt="박영서" initial="박" host />
      <Avatar size="xl" src="https://i.pravatar.cc/120?img=12" alt="이커피" host />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Avatar size="xs" initial="W" />
      <Avatar size="sm" initial="W" />
      <Avatar size="md" initial="W" />
      <Avatar size="lg" initial="W" />
      <Avatar size="xl" initial="W" />
    </div>
  ),
};

export const GroupOverlap: Story = {
  parameters: {
    docs: { description: { story: "기본값 — 아바타가 겹쳐 보이는 그룹 표시." } },
  },
  render: () => (
    <AvatarGroup>
      <Avatar src="https://i.pravatar.cc/120?img=10" alt="A" className="ring-2 ring-surface" />
      <Avatar src="https://i.pravatar.cc/120?img=11" alt="B" className="ring-2 ring-surface" />
      <Avatar src="https://i.pravatar.cc/120?img=12" alt="C" className="ring-2 ring-surface" />
      <Avatar initial="+5" className="ring-2 ring-surface bg-pink-100 text-pink-600" />
    </AvatarGroup>
  ),
};

export const GroupSeparated: Story = {
  parameters: {
    docs: { description: { story: "`variant=\"separated\"` — 아바타가 간격을 두고 떨어진 그룹 표시." } },
  },
  render: () => (
    <AvatarGroup variant="separated">
      <Avatar src="https://i.pravatar.cc/120?img=10" alt="A" />
      <Avatar src="https://i.pravatar.cc/120?img=11" alt="B" />
      <Avatar src="https://i.pravatar.cc/120?img=12" alt="C" />
      <Avatar initial="+5" className="bg-pink-100 text-pink-600" />
    </AvatarGroup>
  ),
};
