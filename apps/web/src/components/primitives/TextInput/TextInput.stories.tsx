import type { Meta, StoryObj } from "@storybook/react";
import { PasswordInput, TextInput } from "./TextInput";

const meta: Meta<typeof TextInput> = {
  title: "Primitives/TextInput",
  component: TextInput,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "DESIGN.md §12 (Input / Form 규칙). 높이 52, radius 14, padding 16.",
      },
    },
  },
  argTypes: {
    leftIcon: { control: "text" },
    error: { control: "text" },
    success: { control: "boolean" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  args: { placeholder: "닉네임을 입력해주세요" },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: "김와라" } };
export const WithIcon: Story = { args: { leftIcon: "search", placeholder: "초대장 검색" } };
export const ErrorState: Story = { args: { error: "이미 사용 중인 닉네임입니다", defaultValue: "김와라" } };
export const Success: Story = { args: { success: true, defaultValue: "사용 가능합니다" } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "변경 불가" } };
export const Readonly: Story = { args: { readOnly: true, defaultValue: "읽기 전용" } };

export const Password: Story = {
  render: () => <PasswordInput placeholder="비밀번호" />,
};
