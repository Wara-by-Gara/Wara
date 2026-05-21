import type { Meta, StoryObj } from "@storybook/react";
import { BottomNavigation } from "@/components/molecules/BottomNavigation";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { PageLayout } from "./PageLayout";

const meta: Meta<typeof PageLayout> = {
  title: "Layout/PageLayout",
  component: PageLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "페이지 외곽 컨테이너. TopBar/BottomBar 슬롯 제공." } },
  },
};
export default meta;
type Story = StoryObj<typeof PageLayout>;

const Filler = ({ rows = 8 }: { rows?: number }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-16 rounded-2xl border border-border bg-surface p-4 text-text-secondary text-sm">
        섹션 {i + 1}
      </div>
    ))}
  </div>
);

export const WithTopBar: Story = {
  render: () => (
    <PageLayout variant="with-top-bar" topBar={<TopAppBar title="홈" />}>
      <Filler />
    </PageLayout>
  ),
};

export const WithBottomNav: Story = {
  render: () => (
    <PageLayout
      variant="with-bottom-nav"
      topBar={<TopAppBar title="홈" />}
      bottomBar={
        <BottomNavigation
          items={[
            { key: "home", label: "홈", icon: "home" },
            { key: "create", label: "만들기", icon: "plus", fab: true },
            { key: "me", label: "마이페이지", icon: "user" },
          ]}
          activeKey="home"
        />
      }
    >
      <Filler />
    </PageLayout>
  ),
};

export const WithStickyCTA: Story = {
  render: () => (
    <PageLayout
      variant="with-sticky-cta"
      topBar={<TopAppBar title="초대장 상세" onBack={() => {}} />}
      bottomBar={<StickyCTA primary={{ label: "참석 여부 선택하기" }} />}
    >
      <Filler />
    </PageLayout>
  ),
};

export const FullScreen: Story = {
  render: () => (
    <PageLayout variant="full-screen" noPadding>
      <div className="flex min-h-screen items-center justify-center bg-pink-100 text-2xl font-bold text-pink-600">
        Full Screen
      </div>
    </PageLayout>
  ),
};

export const ModalPage: Story = {
  render: () => (
    <PageLayout
      variant="modal-page"
      topBar={<TopAppBar title="설정" onBack={() => {}} />}
    >
      <Filler rows={3} />
    </PageLayout>
  ),
};
