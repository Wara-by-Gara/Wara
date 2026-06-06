import type { Meta, StoryObj } from "@storybook/react";
import { LumaLightbox, LumaOverlayShowcase, LumaToast, LumaTooltip } from "./Overlay";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Overlay",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Overlay">
      <LumaRow label="Modal · Menu">
        <LumaOverlayShowcase />
      </LumaRow>
      <LumaRow label="Toast">
        <div className="flex flex-wrap gap-2">
          <LumaToast variant="success" message="저장되었습니다" />
          <LumaToast variant="error" message="실패했습니다" />
          <LumaToast variant="loading" message="불러오는 중..." />
        </div>
      </LumaRow>
      <LumaRow label="Tooltip">
        <div className="flex gap-4">
          <LumaTooltip content="위쪽 툴팁" position="top" />
          <LumaTooltip content="오른쪽 툴팁" position="right" />
        </div>
      </LumaRow>
      <LumaRow label="Lightbox">
        <LumaLightbox src="https://placehold.co/400x240/333537/ffffff?text=Cover" alt="커버 이미지" />
      </LumaRow>
    </LumaSection>
  ),
};

export const ModalAndMenu: Story = {
  render: () => (
    <LumaSection title="Overlay — ModalAndMenu">
      <LumaOverlayShowcase />
    </LumaSection>
  ),
};

export const Toast: Story = {
  render: () => (
    <LumaSection title="Overlay — Toast">
      <div className="flex flex-wrap gap-2">
        <LumaToast variant="success" message="저장되었습니다" />
        <LumaToast variant="error" message="실패했습니다" />
        <LumaToast variant="loading" message="불러오는 중..." />
      </div>
    </LumaSection>
  ),
};

export const Tooltip: Story = {
  render: () => (
    <LumaSection title="Overlay — Tooltip">
      <div className="flex gap-4">
        <LumaTooltip content="위쪽 툴팁" position="top" />
        <LumaTooltip content="오른쪽 툴팁" position="right" />
      </div>
    </LumaSection>
  ),
};

export const Lightbox: Story = {
  render: () => (
    <LumaSection title="Overlay — Lightbox">
      <LumaLightbox src="https://placehold.co/400x240/333537/ffffff?text=Cover" alt="커버 이미지" />
    </LumaSection>
  ),
};
