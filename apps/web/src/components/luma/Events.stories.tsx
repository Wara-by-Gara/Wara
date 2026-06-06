import type { Meta, StoryObj } from "@storybook/react";
import { LumaEventTimeList, LumaEventTitle } from "./Events";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Events",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const TIME_ITEMS = [
  { time: "6월 6일 (토) · 오후 8:00", variant: "default" as const },
  { time: "오후 8:00", variant: "live" as const },
  { time: "오늘, 오후 8:00", variant: "relative" as const },
  { time: "내일, 오전 10:00", variant: "highlight" as const },
];

export const Overview: Story = {
  render: () => (
    <LumaSection title="Events">
      <LumaRow label="EventTitle">
        <div className="space-y-3">
          <LumaEventTitle title="주말 브런치 모임" />
          <LumaEventTitle title="프라이빗 디너" isPrivate />
          <LumaEventTitle title="와라 밋업" isExternal loading />
        </div>
      </LumaRow>
      <LumaRow label="EventTimeList">
        <LumaEventTimeList items={TIME_ITEMS} />
      </LumaRow>
    </LumaSection>
  ),
};

export const EventTitle: Story = {
  render: () => (
    <LumaSection title="Events — EventTitle">
      <div className="space-y-3">
        <LumaEventTitle title="주말 브런치 모임" />
        <LumaEventTitle title="프라이빗 디너" isPrivate />
        <LumaEventTitle title="와라 밋업" isExternal loading />
      </div>
    </LumaSection>
  ),
};

export const EventTimeList: Story = {
  render: () => (
    <LumaSection title="Events — EventTimeList">
      <LumaEventTimeList items={TIME_ITEMS} />
    </LumaSection>
  ),
};
