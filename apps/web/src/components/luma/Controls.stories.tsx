import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LumaOptionButton, LumaSegmentedControl, LumaSlider, LumaToggle } from "./Controls";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Controls",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const THEME_OPTIONS = [
  { value: "light" as const, label: "라이트", icon: "☀️" },
  { value: "dark" as const, label: "다크", icon: "🌙" },
  { value: "system" as const, label: "시스템", icon: "📱" },
];

function SegmentedDemo() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  return <LumaSegmentedControl value={theme} onChange={setTheme} options={THEME_OPTIONS} />;
}

export const Overview: Story = {
  render: () => (
    <LumaSection title="Controls">
      <LumaRow label="Toggle">
        <div className="space-y-0">
          <LumaToggle label="알림" description="푸시 알림을 받습니다" checked />
          <LumaToggle label="위험 모드" color="error" />
          <LumaToggle label="비활성" disabled />
        </div>
      </LumaRow>
      <LumaRow label="SegmentedControl">
        <SegmentedDemo />
      </LumaRow>
      <LumaRow label="Slider">
        <LumaSlider />
      </LumaRow>
      <LumaRow label="OptionButton">
        <div className="grid gap-2 sm:grid-cols-2">
          <LumaOptionButton label="활성" description="현재 선택됨" selected />
          <LumaOptionButton label="보관됨" description="지난 이벤트" />
        </div>
      </LumaRow>
    </LumaSection>
  ),
};

export const Toggle: Story = {
  render: () => (
    <LumaSection title="Controls — Toggle">
      <LumaToggle label="알림" description="푸시 알림을 받습니다" checked />
      <LumaToggle label="위험 모드" color="error" />
      <LumaToggle label="비활성" disabled />
    </LumaSection>
  ),
};

export const SegmentedControl: Story = {
  render: () => (
    <LumaSection title="Controls — SegmentedControl">
      <SegmentedDemo />
    </LumaSection>
  ),
};

export const Slider: Story = {
  render: () => (
    <LumaSection title="Controls — Slider">
      <LumaSlider />
    </LumaSection>
  ),
};

export const OptionButton: Story = {
  render: () => (
    <LumaSection title="Controls — OptionButton">
      <div className="grid gap-2 sm:grid-cols-2">
        <LumaOptionButton label="활성" description="현재 선택됨" selected />
        <LumaOptionButton label="보관됨" description="지난 이벤트" />
      </div>
    </LumaSection>
  ),
};
