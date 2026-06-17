import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TopAppBar, Button, Avatar, AvatarGroup, Badge } from "@wara/ui";

const meta: Meta = {
  title: "Pages/Date Vote",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

interface Slot {
  id: string;
  date: string;
  time: string;
  voters: string[];
}

const SLOTS: Slot[] = [
  { id: "1", date: "12월 23일 (월)", time: "저녁 7시", voters: ["김민지", "이서연", "박도윤"] },
  { id: "2", date: "12월 24일 (화)", time: "저녁 7시", voters: ["김민지", "이서연", "최하준", "정유나"] },
  { id: "3", date: "12월 27일 (금)", time: "저녁 8시", voters: ["박도윤"] },
];

const MAX = 4;

export const Vote: Story = {
  render: function Render() {
    const [voted, setVoted] = useState<Set<string>>(new Set(["2"]));
    const toggle = (id: string) =>
      setVoted((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });

    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
        <TopAppBar title="날짜 투표" onBack={() => {}} />
        <main className="flex flex-1 flex-col gap-3 px-5 pb-28 pt-4">
          <div className="flex flex-col gap-1">
            <h1 className="type-title">언제가 좋아요?</h1>
            <p className="type-body text-text-muted">가능한 날짜를 모두 선택해주세요 (중복 가능)</p>
          </div>

          {SLOTS.map((s) => {
            const isVoted = voted.has(s.id);
            const count = s.voters.length + (isVoted && !SLOTS.find((x) => x.id === s.id)!.voters.includes("나") ? 0 : 0);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={isVoted}
                className={[
                  "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
                  isVoted ? "border-text bg-surface-muted" : "border-border bg-surface hover:bg-surface-muted",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <p className="type-cardTitle text-text">{s.date}</p>
                  <p className="type-bodySmall text-text-muted">{s.time}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <AvatarGroup>
                      {s.voters.slice(0, 3).map((v) => <Avatar key={v} size="xs" name={v} />)}
                      {s.voters.length > 3 ? <Avatar size="xs" name={`+${s.voters.length - 3}`} /> : null}
                    </AvatarGroup>
                    <span className="type-caption text-text-muted">{count || s.voters.length}명</span>
                  </div>
                </div>
                {isVoted ? <Badge tone="accent" solid>투표함</Badge> : null}
              </button>
            );
          })}

          <p className="mt-1 type-bodySmall text-text-muted">
            가장 많은 표: <b className="text-text">12월 24일 (화)</b> · {MAX}명
          </p>
        </main>

        <div className="sticky bottom-0 border-t border-border bg-surface p-4 pb-[max(12px,env(safe-area-inset-bottom))]">
          <Button fullWidth>투표 제출 ({voted.size}개 선택)</Button>
        </div>
      </div>
    );
  },
};
