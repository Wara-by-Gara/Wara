import type { Meta, StoryObj } from "@storybook/react";
import { LumaAspectRatioImage, LumaFixedSizeImage } from "./Image";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const SRC = "https://placehold.co/400x400/333537/ffffff?text=Photo";

const meta: Meta = {
  title: "Image",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Image">
      <LumaRow label="FixedSize">
        <div className="flex flex-wrap items-end gap-4">
          <LumaFixedSizeImage src={SRC} alt="원형" shape="circle" size={64} />
          <LumaFixedSizeImage src={SRC} alt="정사각형" shape="square" size={80} />
          <LumaFixedSizeImage src={SRC} alt="세로형" shape="portrait" size={80} />
          <LumaFixedSizeImage src={SRC} alt="가로형" shape="landscape" size={120} />
        </div>
      </LumaRow>
      <LumaRow label="AspectRatio">
        <LumaAspectRatioImage src="https://placehold.co/640x360/f31a7c/ffffff?text=16:9" alt="배너 이미지" />
      </LumaRow>
    </LumaSection>
  ),
};

export const FixedSize: Story = {
  render: () => (
    <LumaSection title="Image — FixedSize">
      <div className="flex flex-wrap items-end gap-4">
        <LumaFixedSizeImage src={SRC} alt="원형" shape="circle" size={64} />
        <LumaFixedSizeImage src={SRC} alt="정사각형" shape="square" size={80} />
        <LumaFixedSizeImage src={SRC} alt="세로형" shape="portrait" size={80} />
        <LumaFixedSizeImage src={SRC} alt="가로형" shape="landscape" size={120} />
      </div>
    </LumaSection>
  ),
};

export const AspectRatio: Story = {
  render: () => (
    <LumaSection title="Image — AspectRatio">
      <LumaAspectRatioImage src="https://placehold.co/640x360/f31a7c/ffffff?text=16:9" alt="배너 이미지" />
    </LumaSection>
  ),
};
