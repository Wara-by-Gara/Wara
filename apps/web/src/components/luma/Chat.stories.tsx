import type { Meta, StoryObj } from "@storybook/react";
import { LumaChatLauncher, LumaChatThread, LumaFloatingHead } from "./Chat";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Chat",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Chat">
      <LumaRow label="Launcher">
        <div className="flex gap-4">
          <LumaChatLauncher />
          <LumaChatLauncher badge={3} />
          <LumaChatLauncher badge={120} />
        </div>
      </LumaRow>
      <LumaRow label="FloatingHead">
        <div className="flex gap-3">
          <LumaFloatingHead initials="GC" online />
          <LumaFloatingHead initials="AB" />
          <LumaFloatingHead initials="WA" online selected />
        </div>
      </LumaRow>
      <LumaRow label="Thread">
        <LumaChatThread />
      </LumaRow>
    </LumaSection>
  ),
};

export const Launcher: Story = {
  render: () => (
    <LumaSection title="Chat — Launcher">
      <div className="flex gap-4">
        <LumaChatLauncher />
        <LumaChatLauncher badge={3} />
        <LumaChatLauncher badge={120} />
      </div>
    </LumaSection>
  ),
};

export const FloatingHead: Story = {
  render: () => (
    <LumaSection title="Chat — FloatingHead">
      <div className="flex gap-3">
        <LumaFloatingHead initials="GC" online />
        <LumaFloatingHead initials="AB" />
        <LumaFloatingHead initials="WA" online selected />
      </div>
    </LumaSection>
  ),
};

export const Thread: Story = {
  render: () => (
    <LumaSection title="Chat — Thread">
      <LumaChatThread />
    </LumaSection>
  ),
};
