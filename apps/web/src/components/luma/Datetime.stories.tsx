import type { Meta, StoryObj } from "@storybook/react";
import { LumaDateTimeInput, LumaDateTimeRange, LumaTimezoneSelector } from "./Datetime";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Datetime",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <LumaSection title="Datetime">
      <LumaRow label="Range">
        <LumaDateTimeRange
          date="6월 6일 (토)"
          startTime="오후 2:00"
          endTime="오후 5:00"
          timezone="GMT+09:00 서울"
        />
      </LumaRow>
      <LumaRow label="RangeWithoutTimezone">
        <LumaDateTimeRange
          date="6월 7일 (일)"
          startTime="오전 10:00"
          endTime="오후 12:00"
          hideTimezone
        />
      </LumaRow>
      <LumaRow label="SplitInput">
        <LumaDateTimeInput date="6월 6일" time="14:00" />
      </LumaRow>
      <LumaRow label="TimezoneSelector">
        <LumaTimezoneSelector value="GMT+09:00 서울" />
      </LumaRow>
    </LumaSection>
  ),
};

export const Range: Story = {
  render: () => (
    <LumaSection title="Datetime — Range">
      <LumaDateTimeRange
        date="6월 6일 (토)"
        startTime="오후 2:00"
        endTime="오후 5:00"
        timezone="GMT+09:00 서울"
      />
    </LumaSection>
  ),
};

export const RangeWithoutTimezone: Story = {
  render: () => (
    <LumaSection title="Datetime — RangeWithoutTimezone">
      <LumaDateTimeRange
        date="6월 7일 (일)"
        startTime="오전 10:00"
        endTime="오후 12:00"
        hideTimezone
      />
    </LumaSection>
  ),
};

export const SplitInput: Story = {
  render: () => (
    <LumaSection title="Datetime — SplitInput">
      <LumaDateTimeInput date="6월 6일" time="14:00" />
    </LumaSection>
  ),
};

export const TimezoneSelector: Story = {
  render: () => (
    <LumaSection title="Datetime — TimezoneSelector">
      <LumaTimezoneSelector value="GMT+09:00 서울" />
    </LumaSection>
  ),
};
