import type { Meta, StoryObj } from "@storybook/react";
import { LumaTintPreview } from "./Tint";
import { LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Tint",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Tint">
      <LumaTintPreview brandColor="#f31a7c" />
    </LumaSection>
  ),
};
