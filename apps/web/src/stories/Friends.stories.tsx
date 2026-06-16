import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TopAppBar, SearchBar, Avatar, Button, IconButton } from "@wara/ui";
import { ProfileSummary, InviteCard } from "@/components/domain";

const meta: Meta = {
  title: "Pages/Friends",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

const FRIENDS = [
  { name: "이서연", handle: "seoyeon", shared: 2 },
  { name: "박도윤", handle: "doyun", shared: 1 },
  { name: "최하준", handle: "hajun", shared: 3 },
  { name: "정유나", handle: "yuna", shared: 1 },
];

export const FriendList: Story = {
  name: "Friend List",
  render: function Render() {
    const [q, setQ] = useState("");
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
        <TopAppBar title="친구" onBack={() => {}} rightSlot={<IconButton icon="user-plus" label="친구 추가" variant="ghost" />} />
        <div className="px-5 pt-3">
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} placeholder="친구 검색" />
        </div>
        <main className="flex-1 px-5 pt-2">
          <ul className="divide-y divide-border">
            {FRIENDS.filter((f) => !q || f.name.includes(q)).map((f) => (
              <li key={f.handle} className="flex items-center gap-3 py-3">
                <Avatar size="md" name={f.name} />
                <div className="min-w-0 flex-1">
                  <p className="type-body font-semibold text-text">{f.name}</p>
                  <p className="type-bodySmall text-text-muted">함께 아는 모임 {f.shared}개</p>
                </div>
                <IconButton icon="message-circle" label="메시지" variant="secondary" size="sm" />
              </li>
            ))}
          </ul>
        </main>
      </div>
    );
  },
};

export const FriendProfile: Story = {
  name: "Friend Profile",
  render: () => (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <TopAppBar title="이서연" onBack={() => {}} rightSlot={<IconButton icon="more-horizontal" label="더보기" variant="ghost" />} />
      <main className="flex-1 pb-10">
        <section className="px-5 pb-6 pt-4">
          <ProfileSummary
            name="이서연"
            handle="seoyeon"
            bio="여행과 사진을 좋아해요 📷"
            stats={[{ label: "함께한 모임", value: 2 }, { label: "친구", value: 31 }]}
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">메시지</Button>
                <Button size="sm">친구 추가</Button>
              </div>
            }
          />
        </section>
        <section className="px-5">
          <h2 className="mb-3 type-cardTitle">함께한 모임</h2>
          <div className="grid grid-cols-2 gap-3">
            <InviteCard title="와라 송년 파티" dateText="12.24 (화)" imageUrl="https://picsum.photos/seed/f1/400/400" />
            <InviteCard title="여름 캠핑" dateText="작년 8월" imageUrl="https://picsum.photos/seed/f2/400/400" />
          </div>
        </section>
      </main>
    </div>
  ),
};
