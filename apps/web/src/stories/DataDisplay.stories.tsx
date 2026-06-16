import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Text, Avatar, AvatarGroup, Badge, Chip, Spinner, Divider } from "@wara/ui";
import { dsWrap, Section } from "./_dsDecorator";

const meta: Meta = {
  title: "Atoms/Data Display",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const TONES = ["neutral", "accent", "success", "warning", "danger", "info"] as const;

export const Badges: Story = {
  render: () => (
    <div>
      <Section title="soft">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TONES.map((t) => <Badge key={t} tone={t}>{t}</Badge>)}
        </div>
      </Section>
      <Section title="solid">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TONES.map((t) => <Badge key={t} tone={t} solid>{t}</Badge>)}
        </div>
      </Section>
    </div>
  ),
};

export const Chips: Story = {
  render: function Render() {
    const [sel, setSel] = useState(false);
    return (
      <Section title="Chip">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip selected={sel} onClick={() => setSel((s) => !s)}>토글 {sel ? "ON" : "OFF"}</Chip>
          <Chip>기본</Chip>
          <Chip selected>선택됨</Chip>
          <Chip disabled>비활성</Chip>
          <Chip onRemove={() => {}}>제거 가능</Chip>
        </div>
      </Section>
    );
  },
};

export const Avatars: Story = {
  render: () => (
    <div>
      <Section title="size (이니셜 = 성 제외 이름 2글자)">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <Avatar size="xs" name="김와라" />
          <Avatar size="sm" name="이서연" />
          <Avatar size="md" name="박도윤" />
          <Avatar size="lg" src="https://i.pravatar.cc/120?img=12" />
          <Avatar size="xl" />
          <Avatar size="2xl" name="정유나" />
        </div>
      </Section>
      <Section title="AvatarGroup">
        <AvatarGroup>
          <Avatar size="sm" name="김와라" />
          <Avatar size="sm" name="이서연" />
          <Avatar size="sm" name="박도윤" />
          <Avatar size="sm" name="+5" />
        </AvatarGroup>
      </Section>
    </div>
  ),
};

export const SpinnersAndDividers: Story = {
  name: "Spinner & Divider",
  render: () => (
    <div>
      <Section title="Spinner">
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <span style={{ color: "var(--accent)" }}><Spinner size="md" /></span>
        </div>
      </Section>
      <Section title="Divider">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Text variant="body">위</Text>
          <Divider />
          <Text variant="body">soft 아래</Text>
          <Divider strength="strong" />
          <div style={{ display: "flex", height: 36, alignItems: "center", gap: 12 }}>
            <Text variant="body">좌</Text>
            <Divider orientation="vertical" />
            <Text variant="body">우</Text>
          </div>
        </div>
      </Section>
    </div>
  ),
};
