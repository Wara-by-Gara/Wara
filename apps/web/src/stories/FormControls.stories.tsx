import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Input, Textarea, FormField, SearchBar } from "@wara/ui";
import { dsWrap, Section } from "./_dsDecorator";

const meta: Meta = {
  title: "Atoms/Form Controls",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const Inputs: Story = {
  render: () => (
    <div style={{ maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }}>
      <Section title="Input">
        <Input placeholder="기본 (md)" />
        <Input size="sm" placeholder="작게 (sm)" />
        <Input size="lg" placeholder="크게 (lg)" />
        <Input invalid defaultValue="에러 상태" />
        <Input disabled placeholder="비활성" />
      </Section>
      <Section title="Textarea">
        <Textarea placeholder="메시지" showCounter maxLength={200} />
        <Textarea invalid defaultValue="에러 상태" />
      </Section>
    </div>
  ),
};

export const FormFields: Story = {
  render: () => (
    <div style={{ maxWidth: 380, display: "flex", flexDirection: "column", gap: 16 }}>
      <FormField label="모임 이름" required helper="2~20자로 입력해주세요">
        <Input placeholder="예) 와라 송년회" />
      </FormField>
      <FormField label="이메일" error="올바른 이메일을 입력해주세요">
        <Input defaultValue="wrong-email" />
      </FormField>
      <FormField label="소개" counter={{ current: 12, max: 200 }}>
        <Textarea defaultValue="모임을 소개해요" />
      </FormField>
    </div>
  ),
};

export const Search: Story = {
  render: function Render() {
    const [v, setV] = useState("와라");
    return (
      <div style={{ maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }}>
        <SearchBar value={v} onChange={(e) => setV(e.target.value)} onClear={() => setV("")} placeholder="검색" />
        <SearchBar placeholder="취소 버튼" showCancel onCancel={() => {}} />
      </div>
    );
  },
};
