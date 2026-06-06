import type { Meta, StoryObj } from "@storybook/react";
import { LumaEditor } from "./Editor";
import { LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Editor",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Editor">
      <LumaEditor />
    </LumaSection>
  ),
};
