import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RSVPButtonGroup, type RSVPValue } from "./RSVPButtonGroup";

const meta: Meta<typeof RSVPButtonGroup> = {
  title: "Molecules/RSVPButtonGroup",
  component: RSVPButtonGroup,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "DESIGN.md §21 RSVP UI. 참석/미정/불참 3종." } },
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
type Story = StoryObj<typeof RSVPButtonGroup>;

export const Horizontal3: Story = { args: { layout: "horizontal-3" } };
export const Attending: Story = { args: { layout: "horizontal-3", value: "attending" } };
export const Maybe: Story = { args: { layout: "horizontal-3", value: "maybe" } };
export const Declined: Story = { args: { layout: "horizontal-3", value: "declined" } };
export const Stack: Story = { args: { layout: "full-width-stack", value: "attending" } };
export const Closed: Story = { args: { closed: true, helperText: "응답이 마감되었어요" } };
export const FullCapacity: Story = {
  args: { value: "maybe", fullCapacity: true, helperText: "참석 정원이 가득 찼어요" },
};
export const Submitting: Story = {
  args: { value: "attending", loading: true, helperText: "제출 중..." },
};

const InteractiveDemo = () => {
  const [value, setValue] = useState<RSVPValue | undefined>(undefined);
  return (
    <div className="flex flex-col gap-2">
      <RSVPButtonGroup value={value} onValueChange={setValue} />
      <p className="text-[13px] text-text-tertiary">선택: {value ?? "없음"}</p>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
