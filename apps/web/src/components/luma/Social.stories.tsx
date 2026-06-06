import type { Meta, StoryObj } from "@storybook/react";
import { LumaAvatarCluster, LumaAvatarSizes, LumaAvatarStack, LumaInitialsAvatar } from "./Social";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Social",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const STACK_AVATARS = [
  { initials: "A" },
  { initials: "B" },
  { src: "https://i.pravatar.cc/64?img=1" },
  { initials: "C" },
];

export const Overview: Story = {
  render: () => (
    <LumaSection title="Social">
      <LumaRow label="Sizes">
        <LumaAvatarSizes />
      </LumaRow>
      <LumaRow label="AvatarStack">
        <LumaAvatarStack avatars={STACK_AVATARS} overflow={12} />
      </LumaRow>
      <LumaRow label="Initials">
        <LumaInitialsAvatar initials="WA" size={48} />
      </LumaRow>
      <LumaRow label="Cluster">
        <div className="flex gap-4">
          <LumaAvatarCluster variant="single" />
          <LumaAvatarCluster variant="double" />
          <LumaAvatarCluster variant="triple" />
        </div>
      </LumaRow>
    </LumaSection>
  ),
};

export const Sizes: Story = {
  render: () => (
    <LumaSection title="Social — Sizes">
      <LumaAvatarSizes />
    </LumaSection>
  ),
};

export const AvatarStack: Story = {
  render: () => (
    <LumaSection title="Social — AvatarStack">
      <LumaAvatarStack avatars={STACK_AVATARS} overflow={12} />
    </LumaSection>
  ),
};

export const Initials: Story = {
  render: () => (
    <LumaSection title="Social — Initials">
      <LumaInitialsAvatar initials="WA" size={48} />
    </LumaSection>
  ),
};

export const Cluster: Story = {
  render: () => (
    <LumaSection title="Social — Cluster">
      <div className="flex gap-4">
        <LumaAvatarCluster variant="single" />
        <LumaAvatarCluster variant="double" />
        <LumaAvatarCluster variant="triple" />
      </div>
    </LumaSection>
  ),
};
