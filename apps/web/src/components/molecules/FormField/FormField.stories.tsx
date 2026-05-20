import type { Meta, StoryObj } from "@storybook/react";
import { TextInput } from "@/components/primitives/TextInput";
import { Textarea } from "@/components/primitives/Textarea";
import { FormField } from "./FormField";

const meta: Meta<typeof FormField> = {
  title: "Molecules/FormField",
  component: FormField,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "라벨 + 입력 + helper/error/counter를 하나의 필드로 묶음." },
    },
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
type Story = StoryObj<typeof FormField>;

export const Required: Story = {
  args: {
    label: "초대장 제목",
    required: true,
    helper: "친구들이 한눈에 알아볼 수 있는 제목을 입력해주세요",
    children: <TextInput placeholder="예: 와라의 생일 파티" />,
  },
};

export const Optional: Story = {
  args: {
    label: "장소 메모",
    children: <TextInput placeholder="추가 메모를 적어주세요" />,
  },
};

export const ErrorState: Story = {
  args: {
    label: "닉네임",
    required: true,
    error: "이미 사용 중인 닉네임입니다",
    children: <TextInput defaultValue="김와라" error="dup" />,
  },
};

export const WithCounter: Story = {
  args: {
    label: "초대 메시지",
    counter: { current: 12, max: 200 },
    children: <Textarea defaultValue="친구들에게 전할 댓글" />,
  },
};
