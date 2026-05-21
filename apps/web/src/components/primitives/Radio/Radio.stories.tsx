import type { Meta, StoryObj } from "@storybook/react";
import { Radio, RadioGroup } from "./Radio";

const meta: Meta<typeof Radio> = {
  title: "Primitives/Radio",
  component: Radio,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "Radix RadioGroup 기반. 단일 선택 질문/정렬 옵션 등에 사용." },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="public">
      {[
        { value: "public", label: "공개" },
        { value: "link", label: "링크 받은 사람만" },
        { value: "password", label: "비밀번호 입력자만" },
      ].map((opt) => (
        <label key={opt.value} className="flex items-center gap-3 text-[15px] cursor-pointer">
          <Radio value={opt.value} id={opt.value} />
          <span>{opt.label}</span>
        </label>
      ))}
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="a" disabled>
      <label className="flex items-center gap-3 text-[15px]">
        <Radio value="a" /> 비활성 옵션 A
      </label>
      <label className="flex items-center gap-3 text-[15px]">
        <Radio value="b" /> 비활성 옵션 B
      </label>
    </RadioGroup>
  ),
};
