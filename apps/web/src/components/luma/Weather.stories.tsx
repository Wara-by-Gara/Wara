import type { Meta, StoryObj } from "@storybook/react";
import { LumaWeatherGrid } from "./Weather";
import { LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Weather",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Weather">
      <LumaWeatherGrid />
    </LumaSection>
  ),
};
