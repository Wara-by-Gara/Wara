import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  LumaCheckbox,
  LumaCountSelector,
  LumaInput,
  LumaInputWithSubmit,
  LumaMultiSelect,
  LumaRadioGroup,
  LumaSelect,
  LumaTextarea,
} from "./Input";
import { LumaRow, LumaSection } from "./LumaCanvas";
import { lumaDecorator } from "./storyDecorators";

const meta: Meta = {
  title: "Input",
  decorators: [lumaDecorator],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

function RadioDemo() {
  const [radio, setRadio] = useState("있다");
  return <LumaRadioGroup options={["있다", "없다"]} value={radio} onChange={setRadio} />;
}

function CountDemo() {
  const [count, setCount] = useState(2);
  return <LumaCountSelector value={count} onChange={setCount} />;
}

export const Overview: Story = {
  render: () => (
    <LumaSection title="Input">
      <LumaRow label="기본">
        <LumaInput placeholder="텍스트를 입력하세요" />
      </LumaRow>
      <LumaRow label="라벨 포함">
        <LumaInput label="이메일" placeholder="you@example.com" />
      </LumaRow>
      <LumaRow label="오류">
        <LumaInput label="사용자명" error="이미 사용 중인 사용자명입니다" defaultValue="wara" />
      </LumaRow>
      <LumaRow label="성공">
        <LumaInput variant="success" defaultValue="valid@email.com" />
      </LumaRow>
      <LumaRow label="지우기">
        <LumaInput clearable defaultValue="지워보세요" />
      </LumaRow>
      <LumaRow label="액세서리">
        <LumaInput leftAccessory="₩" rightAccessory="KRW" placeholder="0" />
      </LumaRow>
      <LumaRow label="제출 버튼">
        <LumaInputWithSubmit placeholder="이메일을 입력하세요" submitLabel="구독" />
      </LumaRow>
      <LumaRow label="텍스트 영역">
        <LumaTextarea label="설명" placeholder="내용을 입력하세요" />
      </LumaRow>
      <LumaRow label="체크박스">
        <div className="space-y-2">
          <LumaCheckbox label="로그인 상태 유지" checked />
          <LumaCheckbox label="계정 삭제" danger />
        </div>
      </LumaRow>
      <LumaRow label="라디오">
        <RadioDemo />
      </LumaRow>
      <LumaRow label="선택">
        <LumaSelect label="시간대" options={["GMT+09:00 서울", "GMT+00:00 런던", "GMT-05:00 뉴욕"]} value="GMT+09:00 서울" onChange={() => {}} />
      </LumaRow>
      <LumaRow label="다중 선택">
        <LumaMultiSelect tags={["디자인", "개발", "기획"]} />
      </LumaRow>
      <LumaRow label="수량 선택">
        <CountDemo />
      </LumaRow>
    </LumaSection>
  ),
};

export const Default: Story = {
  render: () => (
    <LumaSection title="Input — Default">
      <LumaInput placeholder="텍스트를 입력하세요" />
    </LumaSection>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <LumaSection title="Input — WithLabel">
      <LumaInput label="이메일" placeholder="you@example.com" />
    </LumaSection>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <LumaSection title="Input — Error">
      <LumaInput label="사용자명" error="이미 사용 중인 사용자명입니다" defaultValue="wara" />
    </LumaSection>
  ),
};

export const Success: Story = {
  render: () => (
    <LumaSection title="Input — Success">
      <LumaInput variant="success" defaultValue="valid@email.com" />
    </LumaSection>
  ),
};

export const Clearable: Story = {
  render: () => (
    <LumaSection title="Input — Clearable">
      <LumaInput clearable defaultValue="지워보세요" />
    </LumaSection>
  ),
};

export const Accessories: Story = {
  render: () => (
    <LumaSection title="Input — Accessories">
      <LumaInput leftAccessory="₩" rightAccessory="KRW" placeholder="0" />
    </LumaSection>
  ),
};

export const WithSubmit: Story = {
  render: () => (
    <LumaSection title="Input — WithSubmit">
      <LumaInputWithSubmit placeholder="이메일을 입력하세요" submitLabel="구독" />
    </LumaSection>
  ),
};

export const Textarea: Story = {
  render: () => (
    <LumaSection title="Input — Textarea">
      <LumaTextarea label="설명" placeholder="내용을 입력하세요" />
    </LumaSection>
  ),
};

export const Checkbox: Story = {
  render: () => (
    <LumaSection title="Input — Checkbox">
      <div className="space-y-2">
        <LumaCheckbox label="로그인 상태 유지" checked />
        <LumaCheckbox label="계정 삭제" danger />
      </div>
    </LumaSection>
  ),
};

export const Radio: Story = {
  render: () => (
    <LumaSection title="Input — Radio">
      <RadioDemo />
    </LumaSection>
  ),
};

export const Select: Story = {
  render: () => (
    <LumaSection title="Input — Select">
      <LumaSelect label="시간대" options={["GMT+09:00 서울", "GMT+00:00 런던", "GMT-05:00 뉴욕"]} value="GMT+09:00 서울" onChange={() => {}} />
    </LumaSection>
  ),
};

export const MultiSelect: Story = {
  render: () => (
    <LumaSection title="Input — MultiSelect">
      <LumaMultiSelect tags={["디자인", "개발", "기획"]} />
    </LumaSection>
  ),
};

export const CountSelector: Story = {
  render: () => (
    <LumaSection title="Input — CountSelector">
      <CountDemo />
    </LumaSection>
  ),
};
