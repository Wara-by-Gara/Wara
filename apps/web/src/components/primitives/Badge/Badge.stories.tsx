import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "DESIGN.md §19 (Badge / Chip 규칙) 준수. 참석/미정/불참/D-day 등 상태 표시용. " +
          "Radius 999, 높이 24~28px.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "attending",
        "maybe",
        "declined",
        "noResponse",
        "dday",
        "today",
        "ended",
        "private",
        "host",
        "new",
        "uploading",
        "error",
      ],
    },
    size: { control: "select", options: ["sm", "md"] },
    strength: { control: "select", options: ["soft", "default", "strong"] },
  },
  args: { children: "참석" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Attending: Story = { args: { variant: "attending", children: "참석" } };
export const Maybe: Story = { args: { variant: "maybe", children: "미정" } };
export const Declined: Story = { args: { variant: "declined", children: "불참" } };
export const NoResponse: Story = { args: { variant: "noResponse", children: "미응답" } };
export const Dday: Story = { args: { variant: "dday", children: "D-3" } };
export const Today: Story = { args: { variant: "today", children: "오늘" } };
export const Ended: Story = { args: { variant: "ended", children: "종료됨" } };
export const Private: Story = { args: { variant: "private", children: "비공개" } };
export const Host: Story = { args: { variant: "host", children: "호스트" } };
export const New: Story = { args: { variant: "new", children: "NEW" } };
export const Uploading: Story = { args: { variant: "uploading", children: "업로드 중" } };
export const ErrorBadge: Story = { args: { variant: "error", children: "오류" } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 max-w-md">
      <Badge variant="attending">참석</Badge>
      <Badge variant="maybe">미정</Badge>
      <Badge variant="declined">불참</Badge>
      <Badge variant="noResponse">미응답</Badge>
      <Badge variant="dday">D-3</Badge>
      <Badge variant="today">오늘</Badge>
      <Badge variant="ended">종료됨</Badge>
      <Badge variant="private">비공개</Badge>
      <Badge variant="host">호스트</Badge>
      <Badge variant="new">NEW</Badge>
      <Badge variant="uploading">업로드 중</Badge>
      <Badge variant="error">오류</Badge>
    </div>
  ),
};
