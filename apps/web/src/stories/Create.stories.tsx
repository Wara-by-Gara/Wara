import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Avatar, Icon, Chip, type IconName } from "@wara/ui";
import { fontPresets, type FontPresetKey } from "@/components/invite";

const meta: Meta = {
  title: "Pages/Create",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

const FONTS: { key: FontPresetKey; label: string }[] = [
  { key: "classic", label: "Classic" },
  { key: "eclectic", label: "Eclectic" },
  { key: "fancy", label: "Fancy" },
  { key: "simple", label: "Simple" },
];

function Row({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3.5 text-text-muted">
      <Icon name={icon} size="sm" color="currentColor" decorative />
      <div className="min-w-0 flex-1">{children}</div>
      <Icon name="chevron-right" size="sm" color="currentColor" decorative />
    </div>
  );
}

export const NewEvent: Story = {
  render: function Render() {
    const [title, setTitle] = useState("");
    const [font, setFont] = useState<FontPresetKey>("classic");
    const titleFont = fontPresets[font].fontFamily;

    return (
      <div
        className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {/* 상단 바: 취소 / 제목 / 저장(블루) */}
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <button type="button" className="type-body text-text-muted">취소</button>
          <span className="type-cardTitle">새 모임</span>
          <button type="button" className="type-button text-link">저장</button>
        </header>

        <main className="flex flex-1 flex-col gap-4 px-5 pb-28 pt-4">
          {/* 편집 가능한 제목 + 폰트 칩 */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 없는 모임"
            aria-label="모임 제목"
            className="type-display w-full bg-transparent text-text outline-none placeholder:text-text-disabled"
            style={{ fontFamily: titleFont }}
          />
          <div className="flex gap-2">
            {FONTS.map((f) => (
              <Chip key={f.key} selected={font === f.key} onClick={() => setFont(f.key)}>
                {f.label}
              </Chip>
            ))}
          </div>

          {/* 커버 자리 */}
          <button
            type="button"
            className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong text-text-muted"
          >
            <Icon name="image" size="xl" color="currentColor" decorative />
            <span className="type-bodySmall">커버 이미지 추가</span>
          </button>

          {/* 날짜 */}
          <button type="button" className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-4 text-left">
            <span className="type-sectionTitle text-text">날짜를 정해요</span>
            <Icon name="chevron-down" size="sm" color="currentColor" decorative />
          </button>
          <p className="type-bodySmall text-text-muted">
            정하기 어렵나요? <span className="text-link font-medium">게스트에게 투표받기 →</span>
          </p>

          {/* 정보 행 */}
          <div className="flex flex-col">
            <Row icon="crown">
              <span className="flex items-center gap-2 text-text">
                <Avatar size="xs" name="김민지" /> 민지 · 공동 호스트 추가
              </span>
            </Row>
            <Row icon="map-pin"><span>장소</span></Row>
            <Row icon="users"><span>인원 제한 없음</span></Row>
            <Row icon="ticket"><span>참가비</span></Row>
            <Row icon="sparkles"><span>드레스코드</span></Row>
          </div>

          {/* 추가 옵션 칩 */}
          <div className="flex flex-wrap gap-2">
            {["+ 링크", "+ 플레이리스트", "+ 질문(RSVP)", "+ 단체 메시지"].map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
        </main>

        {/* 하단 Theme / Effect / Settings 툴바 */}
        <div className="sticky bottom-0 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-around rounded-full border border-border bg-surface px-3 py-2.5 shadow-lg">
            {[
              { icon: "palette" as const, label: "테마" },
              { icon: "sparkles" as const, label: "이펙트" },
              { icon: "settings" as const, label: "설정" },
            ].map((t) => (
              <button key={t.label} type="button" className="flex flex-1 flex-col items-center gap-1 text-text">
                <Icon name={t.icon} size="md" color="currentColor" decorative />
                <span className="type-caption">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
