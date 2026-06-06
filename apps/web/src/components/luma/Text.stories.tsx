import type { Meta, StoryObj } from "@storybook/react";
import { LumaLineClamp, LumaLinkedText, LumaPill, LumaSectionTitle, LumaShimmer, LUMA_PILL_STYLES } from "./Text";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Text",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

function PillVariants() {
  return (
    <>
      {LUMA_PILL_STYLES.map((style) => (
        <div key={style} className="flex flex-wrap gap-2">
          <LumaPill color="brand" style={style} icon>브랜드</LumaPill>
          <LumaPill color="success" style={style}>성공</LumaPill>
          <LumaPill color="warning" style={style} dismissible>경고</LumaPill>
        </div>
      ))}
    </>
  );
}

export const Overview: Story = {
  render: () => (
    <LumaSection title="Text">
      <LumaRow label="SectionTitle">
        <LumaSectionTitle title="섹션 제목" subtitle="부제목 설명" />
      </LumaRow>
      <LumaRow label="Shimmer">
        <LumaShimmer lines={3} />
      </LumaRow>
      <LumaRow label="Pill">
        <PillVariants />
      </LumaRow>
      <LumaRow label="LinkedText">
        <LumaLinkedText text="자세한 내용은 https://luma.com 에서 확인하세요." />
      </LumaRow>
      <LumaRow label="LineClamp">
        <LumaLineClamp text="Wara는 모바일 우선 디지털 초대장 서비스입니다. 사용자는 모임을 위한 초대장을 만들어 공유하고, 받은 사람은 참석 여부를 응답합니다." />
      </LumaRow>
    </LumaSection>
  ),
};

export const SectionTitle: Story = {
  render: () => (
    <LumaSection title="Text — SectionTitle">
      <LumaSectionTitle title="섹션 제목" subtitle="부제목 설명" />
    </LumaSection>
  ),
};

export const Shimmer: Story = {
  render: () => (
    <LumaSection title="Text — Shimmer">
      <LumaShimmer lines={3} />
    </LumaSection>
  ),
};

export const Pill: Story = {
  render: () => (
    <LumaSection title="Text — Pill">
      <div className="space-y-3">
        <PillVariants />
      </div>
    </LumaSection>
  ),
};

export const LinkedText: Story = {
  render: () => (
    <LumaSection title="Text — LinkedText">
      <LumaLinkedText text="자세한 내용은 https://luma.com 에서 확인하세요." />
    </LumaSection>
  ),
};

export const LineClamp: Story = {
  render: () => (
    <LumaSection title="Text — LineClamp">
      <LumaLineClamp text="Wara는 모바일 우선 디지털 초대장 서비스입니다. 사용자는 모임을 위한 초대장을 만들어 공유하고, 받은 사람은 참석 여부를 응답합니다." />
    </LumaSection>
  ),
};
