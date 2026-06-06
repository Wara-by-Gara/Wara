import type { Meta, StoryObj } from "@storybook/react";
import { LumaCollapse } from "./Collapse";
import { LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Collapse",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Collapse">
      <LumaCollapse title="Wara가 뭔가요?">
        Wara는 모바일 우선 디지털 초대장 서비스입니다.
      </LumaCollapse>
      <LumaCollapse title="RSVP는 어떻게 하나요?" defaultOpen>
        초대장 상세 화면에서 참석 여부를 선택하고 제출하세요.
      </LumaCollapse>
      <LumaCollapse title="보낸 후에도 수정할 수 있나요?">
        호스트는 언제든 초대장을 수정할 수 있습니다.
      </LumaCollapse>
    </LumaSection>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <LumaSection title="Collapse — Collapsed">
      <LumaCollapse title="Wara가 뭔가요?">
        Wara는 모바일 우선 디지털 초대장 서비스입니다.
      </LumaCollapse>
    </LumaSection>
  ),
};

export const Expanded: Story = {
  render: () => (
    <LumaSection title="Collapse — Expanded">
      <LumaCollapse title="RSVP는 어떻게 하나요?" defaultOpen>
        초대장 상세 화면에서 참석 여부를 선택하고 제출하세요.
      </LumaCollapse>
    </LumaSection>
  ),
};
