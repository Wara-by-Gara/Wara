import type { Meta, StoryObj } from "@storybook/react";
import { LumaButton, LUMA_BUTTON_COLOR_LABELS, LUMA_BUTTON_COLORS } from "./Button";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Button",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

function SolidButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      {LUMA_BUTTON_COLORS.map((color) => (
        <LumaButton key={color} color={color}>{LUMA_BUTTON_COLOR_LABELS[color]}</LumaButton>
      ))}
    </div>
  );
}

export const Overview: Story = {
  render: () => (
    <div className="space-y-8">
      <LumaSection title="Button">
        <LumaRow label="Solid">
          <SolidButtons />
        </LumaRow>
        <LumaRow label="Outline">
          <div className="flex flex-wrap gap-2">
            <LumaButton color="brand" style="outline">브랜드</LumaButton>
            <LumaButton color="primary" style="outline">기본</LumaButton>
            <LumaButton color="success" style="outline">성공</LumaButton>
          </div>
        </LumaRow>
        <LumaRow label="Ghost">
          <div className="flex flex-wrap gap-2">
            <LumaButton color="brand" style="ghost">고스트</LumaButton>
            <LumaButton color="light" style="ghost">연한</LumaButton>
          </div>
        </LumaRow>
        <LumaRow label="Icon · Loading">
          <div className="flex flex-wrap gap-2">
            <LumaButton color="brand" icon="sparkle">아이콘 포함</LumaButton>
            <LumaButton color="primary" loading>로딩 중</LumaButton>
            <LumaButton color="light" style="icon" icon="plus" aria-label="추가" />
            <LumaButton color="brand" style="iconRound" icon="heart" aria-label="좋아요" />
          </div>
        </LumaRow>
        <LumaRow label="Invite · Disabled · FullWidth">
          <div className="space-y-2">
            <LumaButton color="primary" icon="user-plus">초대하기</LumaButton>
            <LumaButton color="secondary" disabled>비활성</LumaButton>
            <LumaButton color="brand" fullWidth icon="share">이벤트 공유</LumaButton>
          </div>
        </LumaRow>
      </LumaSection>
    </div>
  ),
};

export const Solid: Story = {
  render: () => (
    <LumaSection title="Button — Solid">
      <SolidButtons />
    </LumaSection>
  ),
};

export const Outline: Story = {
  render: () => (
    <LumaSection title="Button — Outline">
      <div className="flex flex-wrap gap-2">
        <LumaButton color="brand" style="outline">브랜드</LumaButton>
        <LumaButton color="primary" style="outline">기본</LumaButton>
        <LumaButton color="success" style="outline">성공</LumaButton>
      </div>
    </LumaSection>
  ),
};

export const Ghost: Story = {
  render: () => (
    <LumaSection title="Button — Ghost">
      <div className="flex flex-wrap gap-2">
        <LumaButton color="brand" style="ghost">고스트</LumaButton>
        <LumaButton color="light" style="ghost">연한</LumaButton>
      </div>
    </LumaSection>
  ),
};

export const IconAndLoading: Story = {
  render: () => (
    <LumaSection title="Button — IconAndLoading">
      <div className="flex flex-wrap gap-2">
        <LumaButton color="brand" icon="sparkle">아이콘 포함</LumaButton>
        <LumaButton color="primary" loading>로딩 중</LumaButton>
        <LumaButton color="light" style="icon" icon="plus" aria-label="추가" />
        <LumaButton color="brand" style="iconRound" icon="heart" aria-label="좋아요" />
      </div>
    </LumaSection>
  ),
};

export const InviteDisabledFullWidth: Story = {
  render: () => (
    <LumaSection title="Button — InviteDisabledFullWidth">
      <div className="space-y-2">
        <LumaButton color="primary" icon="user-plus">초대하기</LumaButton>
        <LumaButton color="secondary" disabled>비활성</LumaButton>
        <LumaButton color="brand" fullWidth icon="share">이벤트 공유</LumaButton>
      </div>
    </LumaSection>
  ),
};
