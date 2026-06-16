import type { Meta, StoryObj } from "@storybook/react";
import { TopAppBar, Icon, type IconName } from "@wara/ui";

const meta: Meta = {
  title: "Pages/Settings",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

function Row({ icon, label, value, danger }: { icon: IconName; label: string; value?: string; danger?: boolean }) {
  return (
    <button type="button" className="flex w-full items-center gap-3 px-5 py-4 text-left">
      <Icon name={icon} size="sm" color={danger ? "danger" : "muted"} decorative />
      <span className={`flex-1 type-body ${danger ? "text-danger" : "text-text"}`}>{label}</span>
      {value ? <span className="type-bodySmall text-text-muted">{value}</span> : null}
      {!danger ? <Icon name="chevron-right" size="sm" color="muted" decorative /> : null}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-2">
      <h2 className="px-5 py-2 type-caption font-semibold uppercase tracking-wide text-text-muted">{title}</h2>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

export const Main: Story = {
  render: () => (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <TopAppBar title="설정" onBack={() => {}} />
      <main className="flex-1 divide-y divide-border">
        <Group title="계정">
          <Row icon="user" label="프로필 편집" />
          <Row icon="bell" label="알림" value="켜짐" />
          <Row icon="shield-check" label="차단 관리" />
        </Group>
        <Group title="앱">
          <Row icon="palette" label="테마" value="라이트" />
          <Row icon="globe" label="언어" value="한국어" />
        </Group>
        <Group title="정보">
          <Row icon="file-text" label="이용약관" />
          <Row icon="help-circle" label="고객센터" />
          <Row icon="info" label="버전" value="1.0.0" />
        </Group>
        <Group title="계정 관리">
          <Row icon="log-out" label="로그아웃" danger />
          <Row icon="trash" label="회원 탈퇴" danger />
        </Group>
      </main>
    </div>
  ),
};
