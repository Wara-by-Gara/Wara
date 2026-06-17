import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TopAppBar, SearchBar, Chip, IconButton, Badge } from "@wara/ui";
import { ParticipantList, type Participant } from "@/components/domain";

const meta: Meta = {
  title: "Pages/Participants",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

const ALL: Participant[] = [
  { id: "1", name: "김민지", handle: "minji", status: "attending", isHost: true },
  { id: "2", name: "이서연", handle: "seoyeon", status: "attending", companionCount: 1, memo: "케이크 담당" },
  { id: "3", name: "박도윤", status: "attending", requestPreview: "조금 늦을 것 같아요!" },
  { id: "4", name: "최하준", status: "undecided" },
  { id: "5", name: "정유나", status: "absent" },
  { id: "6", name: "강민재", status: "noResponse" },
];

const FILTERS = [
  { key: "attending", label: "👍 참석", n: 3 },
  { key: "undecided", label: "🤔 미정", n: 1 },
  { key: "absent", label: "😢 불참", n: 1 },
] as const;

export const Manage: Story = {
  render: function Render() {
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState<string | null>(null);
    const list = ALL.filter(
      (p) =>
        (!filter || p.status === filter) &&
        (!q || p.name.includes(q)),
    );
    return (
      <div
        className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <TopAppBar
          title="참여자 관리"
          onBack={() => {}}
          rightSlot={<IconButton icon="settings" label="설정" variant="ghost" />}
        />
        <div className="flex flex-col gap-3 px-5 pt-3">
          <SearchBar
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClear={() => setQ("")}
            placeholder="참여자 검색"
          />
          {/* 정렬 */}
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5 type-bodySmall text-text"
          >
            <span className="flex items-center gap-1.5 text-text-muted">
              <span>정렬: 상태순</span>
            </span>
          </button>
          {/* 필터 칩 */}
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                selected={filter === f.key}
                onClick={() => setFilter((cur) => (cur === f.key ? null : f.key))}
              >
                {f.label} {f.n}
              </Chip>
            ))}
          </div>
        </div>

        <main className="flex-1 px-5 pb-10 pt-2">
          {list.length > 0 ? (
            <ParticipantList participants={list} onMore={() => {}} />
          ) : (
            <p className="py-16 text-center type-bodySmall text-text-muted">결과가 없어요</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Badge tone="neutral">전체 {ALL.length}명</Badge>
          </div>
        </main>
      </div>
    );
  },
};
