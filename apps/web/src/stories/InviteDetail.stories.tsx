import type { Meta, StoryObj } from "@storybook/react";
import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Avatar, AvatarGroup, Badge, Button, Icon, IconButton, type IconName } from "@wara/ui";
import {
  InviteBackdrop,
  getInviteTemplate,
  fontPresets,
  type FontPresetKey,
  type InviteTemplate,
} from "@/components/invite";
import {
  RSVPButtonGroup,
  CommentBox,
  GalleryGrid,
  WeatherCard,
  KakaoMap,
  type RSVPValue,
  type GalleryPhoto,
} from "@/components/domain";

const meta: Meta = {
  title: "Pages/Invite Detail",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

const PHOTOS: GalleryPhoto[] = Array.from({ length: 4 }, (_, i) => ({
  id: String(i),
  url: `https://picsum.photos/seed/wara${i}/240/240`,
  alt: `사진 ${i + 1}`,
}));

const ATTENDEES = ["김민지", "이서연", "박도윤", "최하준", "정유나", "강민재", "윤지후", "한소율", "오지안"];

function InfoRow({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 opacity-70">
        <Icon name={icon} size="sm" color="currentColor" decorative />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** 상세 화면 셸 (배경 + 상단바 + 본문) — Guest/Host 공유 */
function DetailShell({
  template,
  rightActions,
  children,
  bottom,
}: {
  template: InviteTemplate;
  rightActions?: ReactNode;
  children: ReactNode;
  bottom: ReactNode;
}) {
  const ink = template.palette.ink;
  return (
    <div
      className="relative isolate mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <InviteBackdrop template={template} />
      <header className="flex items-center justify-between px-3 pt-3" style={{ color: ink }}>
        <IconButton icon="chevron-left" label="뒤로" variant="glass" />
        <div className="flex gap-1">{rightActions}</div>
      </header>
      <main className="flex flex-1 flex-col gap-5 px-5 pb-32 pt-2" style={{ color: ink }}>
        {children}
      </main>
      <div className="sticky bottom-0">{bottom}</div>
    </div>
  );
}

/** 본문 공통 (제목/커버/일시/정보/설명/앨범) */
function DetailBody({ template, hostBadge }: { template: InviteTemplate; hostBadge?: boolean }) {
  const ink = template.palette.ink;
  const inkMuted = template.palette.inkMuted;
  const titleFont = fontPresets[(template.font ?? "classic") as FontPresetKey].fontFamily;
  return (
    <>
      {/* 메인 사진 (각지게) */}
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-black/5">
        <Image src="https://picsum.photos/seed/cover/600/600" alt="" fill unoptimized className="object-cover" sizes="440px" />
      </div>

      {/* 제목 — 사진 밑, 좌측 정렬 */}
      <div className="flex items-center gap-2">
        <h1 className="type-display break-keep text-left" style={{ fontFamily: titleFont }}>
          와라 송년 파티
        </h1>
        {hostBadge ? <Badge tone="accent">호스팅</Badge> : null}
      </div>

      {/* 날짜/시간 + 모임 내용 + 날씨(인라인) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <p className="type-sectionTitle">12월 24일 (화)</p>
          <p className="type-bodyLarge" style={{ color: inkMuted }}>오후 7:00 – 11:00</p>
          <p className="type-body break-keep" style={{ color: inkMuted }}>
            올 한 해 고생 많았어요. 맛있는 거 먹으면서 함께 마무리해요!
          </p>
        </div>
        {/* 모임 시간 기준 날씨 (3일 이내) */}
        <div className="flex shrink-0 flex-col items-center pt-1">
          <span className="text-[28px] leading-none" aria-hidden>⛅</span>
          <span className="type-bodySmall font-medium" style={{ color: ink }}>7°C</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <InfoRow icon="crown">
          <span className="flex items-center gap-2">
            <Avatar size="xs" name="김민지" />
            <span className="type-body" style={{ color: ink }}>민지 님이 초대합니다</span>
          </span>
        </InfoRow>
        <InfoRow icon="ticket"><span className="type-body">참가비 1만원</span></InfoRow>
        <InfoRow icon="sparkles"><span className="type-body">드레스코드: 파티룩 ✨</span></InfoRow>
      </div>

      {/* 장소 — 지도 카드 */}
      <KakaoMap placeName="성수동 라운지" address="서울 성동구 성수이로 123" onOpen={() => {}} height={160} />

      {/* 참석자 — 가로 스크롤 + lg 아바타 (호스트 우선) */}
      <div className="flex flex-col gap-2">
        <span className="type-bodySmall" style={{ color: inkMuted }}>24명 참석 중</span>
        <AvatarGroup variant="separated" scrollable className="-mx-5 px-5">
          {ATTENDEES.map((n) => (
            <Avatar key={n} size="lg" name={n} />
          ))}
        </AvatarGroup>
      </div>

      {/* 모임 날씨 카드 (상세) */}
      <WeatherCard condition="partlyCloudy" temperatureCelsius={7} rainProbability={20} tip="쌀쌀해요. 겉옷을 챙기세요 🧥" />
    </>
  );
}

/** 사진 앨범 섹션 (RSVP 아래에 배치) */
function AlbumSection() {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-black/5 bg-white/55 p-4 backdrop-blur-[var(--blur-glass)]">
      <div className="flex items-center justify-between">
        <h2 className="type-cardTitle">사진 앨범</h2>
        <Button size="sm" variant="secondary">
          <Icon name="share" size="sm" color="currentColor" decorative /> 공유
        </Button>
      </div>
      <GalleryGrid photos={PHOTOS} columns={4} maxVisible={4} onSelect={() => {}} />
    </section>
  );
}

/** 호스트 하단 글래스 툴바 */
function HostToolbar({ goingCount }: { goingCount: number }) {
  const Btn = ({ icon, label }: { icon: IconName; label: string }) => (
    <button type="button" className="flex flex-1 flex-col items-center gap-1 text-text">
      <Icon name={icon} size="md" color="currentColor" decorative />
      <span className="type-caption">{label}</span>
    </button>
  );
  return (
    <div className="p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-1 rounded-full border border-glass-border bg-surface-glass-strong px-3 py-2 shadow-lg backdrop-blur-[var(--blur-glass-strong)]">
        <Btn icon="edit" label="수정" />
        <Btn icon="megaphone" label="단체메시지" />
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="flex size-11 items-center justify-center rounded-full bg-surface text-text shadow-sm type-cardTitle">
            {goingCount}
          </span>
          <span className="type-caption text-text">참석</span>
        </div>
        <Btn icon="user-plus" label="초대" />
        <Btn icon="more-horizontal" label="더보기" />
      </div>
    </div>
  );
}

export const Guest: Story = {
  render: function Render() {
    const template = getInviteTemplate("balloon-day")!;
    const [rsvp, setRsvp] = useState<RSVPValue | undefined>(undefined);
    const [log, setLog] = useState<string[]>([]);
    return (
      <DetailShell
        template={template}
        rightActions={
          <>
            <IconButton icon="share" label="공유" variant="glass" />
            <IconButton icon="more-horizontal" label="더보기" variant="glass" />
          </>
        }
        bottom={
          <div className="backdrop-blur-[var(--blur-glass)]">
            <CommentBox
              avatarName="나"
              onSubmit={(t) => setLog((l) => [t, ...l])}
              onAddGif={() => {}}
              onAddPhoto={() => {}}
              onAddMention={() => {}}
            />
          </div>
        }
      >
        <DetailBody template={template} />
        {/* RSVP — 앨범 위 */}
        <div className="py-2">
          <RSVPButtonGroup value={rsvp} onValueChange={setRsvp} />
        </div>
        <AlbumSection />
        {log.length > 0 ? (
          <p className="type-bodySmall" style={{ color: template.palette.inkMuted }}>
            방금 댓글: {log[0]}
          </p>
        ) : null}
      </DetailShell>
    );
  },
};

export const Host: Story = {
  render: function Render() {
    const template = getInviteTemplate("balloon-day")!;
    return (
      <DetailShell
        template={template}
        rightActions={
          <>
            <IconButton icon="share" label="공유" variant="glass" />
            <IconButton icon="settings" label="설정" variant="glass" />
          </>
        }
        bottom={<HostToolbar goingCount={24} />}
      >
        <DetailBody template={template} hostBadge />
        <AlbumSection />
        <section className="flex flex-col gap-1">
          <h2 className="type-cardTitle mb-1">활동</h2>
          <div className="flex items-start gap-2 py-1.5">
            <Avatar size="xs" name="이서연" />
            <p className="type-bodySmall"><b>이서연</b> 님이 참석으로 응답했어요</p>
          </div>
          <div className="flex items-start gap-2 py-1.5">
            <Avatar size="xs" name="박도윤" />
            <p className="type-bodySmall"><b>박도윤</b> 님이 댓글을 남겼어요</p>
          </div>
        </section>
      </DetailShell>
    );
  },
};
