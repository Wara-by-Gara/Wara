import type { Meta, StoryObj } from "@storybook/react";
import { LocationCard } from "./LocationCard";

const meta: Meta<typeof LocationCard> = {
  title: "Organisms/LocationCard",
  component: LocationCard,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "DESIGN.md §23. 초대장 상세에는 미리보기 + 길찾기/주소복사." } },
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
type Story = StoryObj<typeof LocationCard>;

export const Preview: Story = {
  args: {
    variant: "preview",
    placeName: "와라 카페",
    address: "서울 마포구 와라로 12",
  },
};

export const Selected: Story = {
  args: {
    variant: "selected",
    placeName: "와라 스튜디오",
    address: "서울 성동구 성수일로 88",
    mapPreviewUrl: "https://placehold.co/640x360/FFE1EF/FF4FA3?text=Map",
  },
};

export const Online: Story = {
  args: { variant: "online", onlineLink: "https://meet.example.com/wara-2026-05-20" },
};

export const Unknown: Story = { args: { variant: "unknown" } };
