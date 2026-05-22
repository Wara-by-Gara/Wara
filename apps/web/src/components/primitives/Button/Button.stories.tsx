import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "@/components/icons";
import { Button } from "./Button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "DESIGN.md §11 (Button 규칙) 준수. 화면당 Primary는 1개만 권장하며, " +
          "하단 고정 CTA는 Large(56px) 크기를 사용합니다.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "text", "danger"],
    },
    size: { control: "select", options: ["lg", "md", "sm"] },
    fullWidth: { control: "boolean" },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    children: "초대장 만들기",
  },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "취소" } };
export const Outline: Story = { args: { variant: "outline", children: "다음" } };
export const Ghost: Story = { args: { variant: "ghost", children: "더보기" } };
export const Text: Story = { args: { variant: "text", children: "건너뛰기" } };
export const Danger: Story = { args: { variant: "danger", children: "초대장 삭제" } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="lg">
        Large
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="sm">
        Small
      </Button>
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args}>Default</Button>
      <Button {...args} disabled>
        Disabled
      </Button>
      <Button {...args} loading>
        Loading
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Icon name="plus" size="sm" color="inverse" decorative />
        초대장 만들기
      </>
    ),
  },
};

export const FullWidth: Story = {
  args: { fullWidth: true, size: "lg", children: "참석할게요" },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};
