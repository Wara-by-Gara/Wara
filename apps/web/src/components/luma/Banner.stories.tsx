import type { Meta, StoryObj } from "@storybook/react";
import { LumaBanner } from "./Banner";
import { LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Banner",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Banner">
      <div className="space-y-3">
        <LumaBanner variant="neutral" description="안내 배너입니다." />
        <LumaBanner variant="success" title="저장 완료" description="변경 사항이 저장되었습니다." cta="자세히 보기" />
        <LumaBanner variant="warning" description="이벤트가 1시간 후에 시작됩니다." action="알림 받기" />
        <LumaBanner variant="error" description="결제에 실패했습니다. 다시 시도해 주세요." />
      </div>
    </LumaSection>
  ),
};

export const Neutral: Story = {
  render: () => (
    <LumaSection title="Banner — Neutral">
      <LumaBanner variant="neutral" description="안내 배너입니다." />
    </LumaSection>
  ),
};

export const Success: Story = {
  render: () => (
    <LumaSection title="Banner — Success">
      <LumaBanner variant="success" title="저장 완료" description="변경 사항이 저장되었습니다." cta="자세히 보기" />
    </LumaSection>
  ),
};

export const Warning: Story = {
  render: () => (
    <LumaSection title="Banner — Warning">
      <LumaBanner variant="warning" description="이벤트가 1시간 후에 시작됩니다." action="알림 받기" />
    </LumaSection>
  ),
};

export const ErrorVariant: Story = {
  render: () => (
    <LumaSection title="Banner — Error">
      <LumaBanner variant="error" description="결제에 실패했습니다. 다시 시도해 주세요." />
    </LumaSection>
  ),
};
