import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  FormField,
  TopAppBar,
  BottomNavigation,
  SearchBar,
  Tabs,
  EmptyState,
} from "@wara/ui";
import { AppShell, FormPageTemplate, ListPageTemplate } from "@/components/templates";

const meta: Meta = {
  title: "Templates/Page Templates",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const NAV = [
  { key: "home", label: "홈", icon: "home" as const },
  { key: "calendar", label: "일정", icon: "calendar" as const },
  { key: "create", label: "만들기", icon: "plus" as const, fab: true },
  { key: "friends", label: "친구", icon: "users" as const },
  { key: "my", label: "마이", icon: "user" as const },
];

export const FormPage: Story = {
  render: () => (
    <FormPageTemplate
      header={<TopAppBar title="모임 만들기" onBack={() => {}} />}
      actions={
        <>
          <Button variant="secondary" className="flex-1">임시저장</Button>
          <Button className="flex-[2]">다음</Button>
        </>
      }
    >
      <FormField label="모임 이름" required helper="2~20자">
        <Input placeholder="예) 와라 송년회" />
      </FormField>
      <FormField label="소개">
        <Textarea placeholder="모임을 소개해주세요" showCounter maxLength={200} />
      </FormField>
    </FormPageTemplate>
  ),
};

export const ListPage: Story = {
  render: function Render() {
    const [tab, setTab] = useState("all");
    return (
      <ListPageTemplate
        header={<TopAppBar title="모임" largeTitle />}
        toolbar={
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SearchBar placeholder="검색" />
            <Tabs items={[{ value: "all", label: "전체" }, { value: "going", label: "참석" }]} value={tab} onValueChange={setTab} aria-label="필터" />
          </div>
        }
        footer={<BottomNavigation items={NAV} activeKey="home" />}
      >
        <EmptyState title="아직 모임이 없어요" description="새 모임을 만들어보세요" />
      </ListPageTemplate>
    );
  },
};

export const Shell: Story = {
  render: () => (
    <AppShell
      header={<TopAppBar title="홈" largeTitle rightSlot={<Button size="sm" variant="text">알림</Button>} />}
      footer={<BottomNavigation items={NAV} activeKey="home" />}
    >
      <div style={{ padding: 20 }}>
        <div style={{ height: 220, borderRadius: 16, background: "var(--surface-muted)" }} />
        <p className="type-body" style={{ marginTop: 12, color: "var(--text-muted)" }}>스크롤 본문 영역</p>
      </div>
    </AppShell>
  ),
};
