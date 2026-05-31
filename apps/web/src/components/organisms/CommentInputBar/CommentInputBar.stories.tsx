import type { Meta, StoryObj } from "@storybook/react";
import { CommentInputBar } from "./CommentInputBar";

const meta: Meta<typeof CommentInputBar> = {
  title: "Organisms/CommentInputBar",
  component: CommentInputBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "댓글 하단 고정 입력 바. 키보드 안전 영역 고려." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
  args: {},
};
export default meta;
type Story = StoryObj<typeof CommentInputBar>;

export const Empty: Story = {};
export const Disabled: Story = { args: { state: "disabled" } };
export const LoginRequired: Story = { args: { state: "loginRequired" } };
export const Submitting: Story = { args: { state: "submitting" } };
export const ErrorState: Story = { args: { state: "error" } };
