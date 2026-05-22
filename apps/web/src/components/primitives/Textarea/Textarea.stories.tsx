import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Primitives/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "DESIGN.md §12. 초대장 설명/요청사항/댓글/문의 등에 사용." },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: { placeholder: "전하고 싶은 말을 적어주세요" },
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: "친구들이 모여서 즐겁게 보내요" } };
export const Focus: Story = { args: { autoFocus: true } };
export const ErrorState: Story = { args: { error: "내용을 입력해주세요" } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "수정 불가" } };
export const WithCounter: Story = {
  args: { showCounter: true, maxLength: 200, defaultValue: "안녕" },
};
