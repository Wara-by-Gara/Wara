import type { Meta, StoryObj } from "@storybook/react";
import { TopAppBar, Avatar, Badge, Button, Icon } from "@wara/ui";
import { KakaoMap } from "@/components/domain";

const meta: Meta = {
  title: "Pages/Location",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

const PEOPLE = [
  { name: "김민지", status: "도착", tone: "success" as const },
  { name: "이서연", status: "5분 거리", tone: "info" as const },
  { name: "박도윤", status: "이동 중", tone: "warning" as const },
  { name: "최하준", status: "위치 비공개", tone: "neutral" as const },
];

export const LiveShare: Story = {
  name: "Live Location",
  render: () => (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <TopAppBar
        title="실시간 위치"
        onBack={() => {}}
        rightSlot={<Button size="sm" variant="secondary"><Icon name="locate" size="sm" color="currentColor" decorative /> 내 위치</Button>}
      />
      <main className="flex-1">
        <div className="px-4 pt-3">
          <KakaoMap placeName="성수동 라운지" address="서울 성동구 성수이로 123" onOpen={() => {}} height={240} />
        </div>
        <section className="px-5 pt-5">
          <h2 className="mb-2 type-cardTitle">참여자 위치</h2>
          <ul className="divide-y divide-border">
            {PEOPLE.map((p) => (
              <li key={p.name} className="flex items-center gap-3 py-3">
                <Avatar size="sm" name={p.name} />
                <span className="flex-1 type-body text-text">{p.name}</span>
                <Badge tone={p.tone}>{p.status}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 type-caption text-text-muted">위치는 모임 종료 후 자동으로 비공개됩니다.</p>
        </section>
      </main>
    </div>
  ),
};
