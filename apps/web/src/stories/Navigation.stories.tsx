import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button, Tabs, TopAppBar, BottomNavigation } from "@wara/ui";
import { dsWrap, Section } from "./_dsDecorator";

const meta: Meta = {
  title: "Molecules/Navigation",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const TABS = [
  { value: "all", label: "전체" },
  { value: "going", label: "참석" },
  { value: "maybe", label: "미정" },
];

const NAV = [
  { key: "home", label: "홈", icon: "home" as const },
  { key: "calendar", label: "일정", icon: "calendar" as const },
  { key: "create", label: "만들기", icon: "plus" as const, fab: true },
  { key: "friends", label: "친구", icon: "users" as const, badge: true },
  { key: "my", label: "마이", icon: "user" as const },
];

export const TabsStory: Story = {
  name: "Tabs",
  render: function Render() {
    const [a, setA] = useState("all");
    const [b, setB] = useState("going");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 380 }}>
        <Section title="underline">
          <Tabs items={TABS} value={a} onValueChange={setA} aria-label="필터" />
        </Section>
        <Section title="segment / fullWidth">
          <Tabs items={TABS} value={b} onValueChange={setB} variant="segment" fullWidth aria-label="보기" />
        </Section>
      </div>
    );
  },
};

export const TopAppBarStory: Story = {
  name: "TopAppBar",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <TopAppBar title="모임 만들기" onBack={() => {}} rightSlot={<Button size="sm" variant="text">완료</Button>} />
      <TopAppBar title="홈" largeTitle />
      <TopAppBar variant="glass" title="글래스" onBack={() => {}} />
    </div>
  ),
};

export const BottomNavigationStory: Story = {
  name: "BottomNavigation",
  render: function Render() {
    const [k, setK] = useState("home");
    return <BottomNavigation items={NAV} activeKey={k} onSelect={setK} />;
  },
};
