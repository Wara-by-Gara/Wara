import type { Meta, StoryObj } from "@storybook/react";
import { LocationSelector } from "./LocationSelector";

const meta: Meta<typeof LocationSelector> = {
  title: "Molecules/LocationSelector",
  component: LocationSelector,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "장소 검색 / 직접 입력 / 미정." } } },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof LocationSelector>;

export const Search: Story = { args: { mode: "search" } };
export const Selected: Story = {
  args: {
    mode: "selected",
    selected: { name: "와라 카페", address: "서울 마포구 어쩌고로 12" },
  },
};
export const Manual: Story = { args: { mode: "manual", manualAddress: "서울시 마포구" } };
export const Loading: Story = { args: { mode: "search", state: "loading", query: "강남" } };
export const NoResult: Story = { args: { mode: "search", state: "no-result", query: "ㅁㄴㅇㄹ" } };
export const PermissionRequired: Story = {
  args: { mode: "search", state: "permission-required" },
};
export const ErrorState: Story = { args: { mode: "search", error: "장소를 불러오지 못했어요" } };
