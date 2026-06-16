import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Text, Chip, IconButton, BottomNavigation } from "@wara/ui";
import { InviteCard } from "@/components/domain";

const meta: Meta = {
  title: "Pages/Home",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

const NAV = [
  { key: "home", label: "홈", icon: "home" as const },
  { key: "calendar", label: "일정", icon: "calendar" as const },
  { key: "create", label: "만들기", icon: "plus" as const, fab: true },
  { key: "friends", label: "친구", icon: "users" as const, badge: true },
  { key: "my", label: "마이", icon: "user" as const },
];

const FILTERS = [
  { key: "upcoming", label: "예정 2" },
  { key: "hosting", label: "호스팅 1" },
  { key: "open", label: "오픈초대" },
  { key: "past", label: "지난모임" },
];

const AVATARS = [{ name: "김민지" }, { name: "이서연" }, { name: "박도윤" }];

export const Feed: Story = {
  render: function Render() {
    const [filter, setFilter] = useState("upcoming");
    const [nav, setNav] = useState("home");
    return (
      <div
        className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {/* 상단 바 */}
        <header className="flex items-center justify-between px-5 pt-4">
          <span className="type-title">와라</span>
          <div className="flex gap-1">
            <IconButton icon="bell" label="알림" variant="ghost" />
            <IconButton icon="message-circle" label="메시지" variant="ghost" />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 px-5 pb-24 pt-3">
          <div className="flex flex-col gap-1">
            <Text variant="title">안녕하세요, 민지님 👋</Text>
            <p className="type-body text-text-muted">
              영감이 필요하세요? <span className="text-link font-medium">파티 지니에게 물어보기</span>
            </p>
          </div>

          {/* 필터 칩 */}
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {FILTERS.map((f) => (
              <Chip key={f.key} selected={filter === f.key} onClick={() => setFilter(f.key)} className="shrink-0">
                {f.label}
              </Chip>
            ))}
          </div>

          {/* 이벤트 카드 */}
          <div className="grid grid-cols-2 gap-3">
            <InviteCard
              title="와라 송년 파티"
              dateText="12.24 (화) 19:00"
              locationText="성수동 라운지"
              imageUrl="https://picsum.photos/seed/p1/400/400"
              badge={{ label: "D-3", tone: "info" }}
              participants={AVATARS}
              participantTotal={24}
            />
            <InviteCard
              title="제주 여행"
              dateText="1.10 (토)"
              locationText="제주"
              imageUrl="https://picsum.photos/seed/p2/400/400"
              badge={{ label: "호스팅", tone: "accent" }}
            />
          </div>
          <InviteCard
            layout="horizontal"
            title="토요 러닝 모임"
            dateText="매주 토요일 아침 7시"
            locationText="한강공원"
            imageUrl="https://picsum.photos/seed/p3/240/240"
            participants={AVATARS}
            participantTotal={8}
          />
        </main>

        <div className="sticky bottom-0">
          <BottomNavigation items={NAV} activeKey={nav} onSelect={setNav} />
        </div>
      </div>
    );
  },
};
