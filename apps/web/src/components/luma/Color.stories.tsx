import type { Meta, StoryObj } from "@storybook/react";
import { LumaColorLabels, LumaColorPicker, LumaColorScales } from "./Color";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Color",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Color">
      <LumaRow label="Labels">
        <LumaColorLabels />
      </LumaRow>
      <LumaRow label="Picker">
        <LumaColorPicker />
      </LumaRow>
      <LumaRow label="Scales">
        <LumaColorScales />
      </LumaRow>
    </LumaSection>
  ),
};

export const Labels: Story = {
  render: () => (
    <LumaSection title="Color — Labels">
      <LumaColorLabels />
    </LumaSection>
  ),
};

export const Picker: Story = {
  render: () => (
    <LumaSection title="Color — Picker">
      <LumaColorPicker />
    </LumaSection>
  ),
};

export const Scales: Story = {
  render: () => (
    <LumaSection title="Color — Scales">
      <LumaColorScales />
    </LumaSection>
  ),
};
