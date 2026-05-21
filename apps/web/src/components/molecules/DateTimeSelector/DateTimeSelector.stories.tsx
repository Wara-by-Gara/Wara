import type { Meta, StoryObj } from "@storybook/react";
import { DateTimeSelector } from "./DateTimeSelector";

const meta: Meta<typeof DateTimeSelector> = {
  title: "Molecules/DateTimeSelector",
  component: DateTimeSelector,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "모임 날짜·시간 선택. 미정 토글 포함." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof DateTimeSelector>;

export const Date: Story = {
  args: { mode: "date", label: "모임 날짜", value: "2026-05-19" },
};

export const Time: Story = {
  args: { mode: "time", label: "시작 시간", value: "19:30" },
};

export const DateRange: Story = {
  args: { mode: "date-range", label: "기간", value: "2026-05-19", endValue: "2026-05-21" },
};

export const TimeRange: Story = {
  args: { mode: "time-range", label: "시간대", value: "18:00", endValue: "22:00" },
};

export const UnknownToggle: Story = {
  args: {
    mode: "date",
    label: "모임 날짜",
    value: "2026-05-19",
    unknownToggle: true,
  },
};

export const ErrorState: Story = {
  args: { mode: "date", label: "모임 날짜", error: "지난 날짜는 선택할 수 없어요" },
};
