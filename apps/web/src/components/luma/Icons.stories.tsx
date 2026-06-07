import type { Meta, StoryObj } from "@storybook/react";
import { LumaIconGrid, LumaIconSearch, LumaIconSizes } from "./Icons";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Icons",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Icons">
      <LumaRow label="Search">
        <LumaIconSearch />
      </LumaRow>
      <LumaRow label="Sizes">
        <LumaIconSizes />
      </LumaRow>
      <LumaRow label="Grid">
        <LumaIconGrid />
      </LumaRow>
    </LumaSection>
  ),
};

export const Search: Story = {
  render: () => (
    <LumaSection title="Icons — Search">
      <LumaIconSearch />
    </LumaSection>
  ),
};

export const Sizes: Story = {
  render: () => (
    <LumaSection title="Icons — Sizes">
      <LumaIconSizes />
    </LumaSection>
  ),
};

export const Grid: Story = {
  render: () => (
    <LumaSection title="Icons — Grid">
      <LumaIconGrid />
    </LumaSection>
  ),
};
