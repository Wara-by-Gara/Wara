import type { Meta, StoryObj } from "@storybook/react";
import { LumaTimeline } from "./Timeline";
import { LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Timeline",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Timeline">
      <LumaTimeline
        items={[
          { title: "오전 9:00", content: "입장 시작" },
          { title: "오전 10:00", content: "환영 및 소개" },
          { title: "오후 12:00", content: "점심 시간" },
          { title: "오후 2:00", content: "워크숍 세션" },
        ]}
      />
    </LumaSection>
  ),
};
