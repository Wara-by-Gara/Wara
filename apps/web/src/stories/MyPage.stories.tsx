import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button, Icon, Divider, BottomNavigation, type IconName } from "@wara/ui";
import { ProfileSummary, InviteCard } from "@/components/domain";

const meta: Meta = {
  title: "Pages/My Page",
  parameters: { layout: "fullscreen", mobileFrame: false },
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

function MenuRow({ icon, label, value }: { icon: IconName; label: string; value?: string }) {
  return (
    <button type="button" className="flex w-full items-center gap-3 px-5 py-4 text-left">
      <Icon name={icon} size="sm" color="muted" decorative />
      <span className="flex-1 type-body text-text">{label}</span>
      {value ? <span className="type-bodySmall text-text-muted">{value}</span> : null}
      <Icon name="chevron-right" size="sm" color="muted" decorative />
    </button>
  );
}

export const Profile: Story = {
  render: function Render() {
    const [nav, setNav] = useState("my");
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
        <header className="flex items-center justify-end gap-1 px-3 pt-3">
          <Icon name="settings" size="md" color="muted" decorative />
        </header>
        <main className="flex-1 pb-24">
          <section className="px-5 pb-6 pt-2">
            <ProfileSummary
              name="김민지"
              handle="minji"
              bio="모임 만들기를 좋아하는 호스트 ✨"
              stats={[
                { label: "모임", value: 12 },
                { label: "친구", value: 48 },
                { label: "사진", value: 230 },
              ]}
              action={<Button size="sm" variant="secondary">프로필 편집</Button>}
            />
          </section>

          <section className="px-5">
            <h2 className="mb-3 type-cardTitle">내 모임</h2>
            <div className="grid grid-cols-2 gap-3">
              <InviteCard title="와라 송년 파티" dateText="12.24 (화)" imageUrl="https://picsum.photos/seed/m1/400/400" badge={{ label: "호스팅", tone: "accent" }} />
              <InviteCard title="제주 여행" dateText="1.10 (토)" imageUrl="https://picsum.photos/seed/m2/400/400" />
            </div>
          </section>

          <Divider className="my-5" />

          <nav className="flex flex-col">
            <MenuRow icon="bell" label="알림 설정" />
            <MenuRow icon="shield-check" label="차단 관리" />
            <MenuRow icon="file-text" label="이용약관" />
            <MenuRow icon="help-circle" label="고객센터" />
            <MenuRow icon="log-out" label="로그아웃" />
          </nav>
        </main>
        <div className="sticky bottom-0">
          <BottomNavigation items={NAV} activeKey={nav} onSelect={setNav} />
        </div>
      </div>
    );
  },
};
