import type { Meta, StoryObj } from "@storybook/react";
import { Button, IconButton } from "@wara/ui";
import { dsWrap, Section } from "./_dsDecorator";

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
  args: { children: "버튼" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "oncolor", "secondary", "glass", "ghost", "danger", "text"],
    },
    size: { control: "select", options: ["lg", "md", "sm"] },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

const VARIANTS = ["primary", "oncolor", "secondary", "glass", "ghost", "danger", "text"] as const;

export const Playground: Story = {
  args: { variant: "primary", size: "md" },
};

export const Variants: Story = {
  render: () => (
    <div>
      <Section title="variant 7종 (그라데이션 위에 oncolor)">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: 16, borderRadius: 16, background: "var(--gradient-vibrant)" }}>
          {VARIANTS.map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
        </div>
      </Section>
      <Section title="size">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button size="lg">시작하기 (lg)</Button>
          <Button size="md">초대장 (md)</Button>
          <Button size="sm">작게 (sm)</Button>
        </div>
      </Section>
      <Section title="glow (히어로 CTA · 각진 + 무지개)">
        <Button glow size="lg" fullWidth>시작하기</Button>
      </Section>
      <Section title="state">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button loading>로딩</Button>
          <Button disabled>비활성</Button>
          <Button fullWidth>fullWidth</Button>
        </div>
      </Section>
    </div>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <Section title="IconButton">
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {(["primary", "secondary", "glass", "ghost", "danger"] as const).map((v) => (
          <IconButton key={v} icon="bell" label={`알림 ${v}`} variant={v} />
        ))}
        <IconButton icon="heart" label="좋아요" size="lg" />
        <IconButton icon="close" label="닫기" size="sm" />
      </div>
    </Section>
  ),
};
