import type { Meta, StoryObj } from "@storybook/react";
import { AutoSlide } from "./AutoSlide";
import { mockTemplateSlides } from "@/lib/mockData";

const meta: Meta<typeof AutoSlide> = {
  title: "Molecules/AutoSlide",
  component: AutoSlide,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof AutoSlide>;

export const Default: Story = {
  args: {
    slides: mockTemplateSlides,
    intervalMs: 4000,
  },
};

export const Fast: Story = {
  args: {
    slides: mockTemplateSlides,
    intervalMs: 2500,
  },
};

export const Single: Story = {
  args: {
    slides: [mockTemplateSlides[0]!],
  },
};
