import type { Meta, StoryObj } from "@storybook/react";
import Image from "next/image";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";
import { Avatar } from "@/components/primitives/Avatar";
import { Icon } from "@/components/icons";

/* ─────────────────────────────────────────────────────────
   Mock data
───────────────────────────────────────────────────────── */
const MOCK_USER = {
  name: "강에스더",
  handle: "esther",
  avatarUrl: "https://i.pravatar.cc/200?img=47",
  verified: true,
  stats: { joined: 12, hosted: 8, likes: 126 },
};

const MOCK_MEMORY = {
  imageUrl: "https://placehold.co/120x120/D6E8D4/3D6B35?text=🌸",
  title: "한옥마을 봄나들이",
  date: "2024. 04. 13 (토)",
  excerpt: "따뜻한 봄날, 함께 걸었던 한옥마을의 추억 🌸",
};

/** Place log 핀 위치 (map mock) */
const PLACE_PINS = [
  { id: "p1", top: "20%", left: "68%", label: "경기진", src: "https://placehold.co/64x64/B8D9C8/2C5F3E?text=🌲" },
  { id: "p2", top: "45%", left: "28%", label: "롱남문", src: "https://placehold.co/64x64/F4D9B0/7A5C2E?text=🏯" },
  { id: "p3", top: "62%", left: "50%", label: "전주 한옥마을", src: "https://placehold.co/64x64/FAE5D3/8C4B2A?text=🏡" },
];

/* ─────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────── */
function StatItem({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5">
      <span className="text-[15px] font-bold text-text-primary">{value}</span>
      <span className="text-[11px] text-text-tertiary">{label}</span>
    </div>
  );
}

function MockMapSection() {
  return (
    <div className="relative h-[200px] overflow-hidden rounded-2xl bg-[#E8F0E4]">
      {/* 도로망 mock */}
      <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="60%" x2="100%" y2="55%" stroke="#8FA88A" strokeWidth="6" />
        <line x1="35%" y1="0" x2="38%" y2="100%" stroke="#8FA88A" strokeWidth="4" />
        <line x1="60%" y1="0" x2="62%" y2="100%" stroke="#8FA88A" strokeWidth="3" />
        <line x1="0" y1="30%" x2="100%" y2="35%" stroke="#8FA88A" strokeWidth="3" />
        <line x1="0" y1="80%" x2="100%" y2="75%" stroke="#8FA88A" strokeWidth="2" />
      </svg>

      {/* Photo pins */}
      {PLACE_PINS.map((pin) => (
        <div
          key={pin.id}
          className="absolute flex flex-col items-center"
          style={{ top: pin.top, left: pin.left, transform: "translate(-50%, -50%)" }}
        >
          <div className="relative size-14 overflow-hidden rounded-xl border-2 border-white shadow-md">
            <Image src={pin.src} alt={pin.label} fill className="object-cover" />
          </div>
          <div className="mt-1 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-text-secondary shadow-sm">
            {pin.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function BottomNav({ active = "profile" }: { active?: string }) {
  const items = [
    { key: "home", icon: "home", label: "홈" },
    { key: "explore", icon: "users-round", label: "모임" },
    { key: "create", icon: "plus", label: "", isFab: true },
    { key: "notifications", icon: "bell", label: "알림", badge: true },
    { key: "profile", icon: "user-round", label: "마이페이지" },
  ] as const;

  return (
    <div className="flex items-center border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const isActive = item.key === active;
        if (item.isFab) {
          return (
            <div key={item.key} className="flex flex-1 items-center justify-center py-2">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand shadow-md">
                <Icon name="plus" size="lg" color="white" decorative />
              </div>
            </div>
          );
        }
        return (
          <div key={item.key} className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5">
            {item.badge && (
              <span className="absolute right-[calc(50%-8px)] top-1.5 size-2 rounded-full bg-brand" />
            )}
            <Icon
              name={item.icon as Parameters<typeof Icon>[0]["name"]}
              size="md"
              color={isActive ? "primary" : "inactive"}
              decorative
            />
            <span
              className={`text-[10px] font-medium ${isActive ? "text-brand" : "text-text-tertiary"}`}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Screen states
───────────────────────────────────────────────────────── */
export type MyPageScreenState = "default" | "loggedOut" | "loading" | "error";

interface MyPageScreenProps {
  state?: MyPageScreenState;
}

function MyPageScreen({ state = "default" }: MyPageScreenProps) {
  /* ── 공통 레이아웃 wrapper ── */
  const wrap = (children: React.ReactNode) => (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-hidden bg-background-soft">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        <span className="text-[17px] font-bold text-text-primary">마이페이지</span>
        <button type="button" aria-label="설정" className="inline-flex size-9 items-center justify-center">
          <Icon name="settings" size="md" color="secondary" decorative />
        </button>
      </div>

      {/* Content */}
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>

      {/* Bottom nav */}
      <BottomNav active="profile" />
    </div>
  );

  /* ── LoggedOut ── */
  if (state === "loggedOut") {
    return wrap(
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-cranberry-5">
          <Icon name="user-round-cog" size="xl" color="brand" decorative />
        </div>
        <p className="text-[16px] font-bold text-text-primary">로그인이 필요해요</p>
        <p className="text-[13px] text-text-tertiary">
          로그인하면 내 초대장과 추억을 한곳에서 볼 수 있어요
        </p>
        <button
          type="button"
          className="mt-2 rounded-full bg-brand px-8 py-3 text-[15px] font-bold text-white shadow-sm"
        >
          로그인
        </button>
      </div>
    );
  }

  /* ── Loading ── */
  if (state === "loading") {
    return wrap(
      <div className="flex flex-col gap-4 p-4">
        {/* Profile skeleton */}
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-6 shadow-sm">
          <div className="size-24 animate-pulse rounded-full bg-border" />
          <div className="h-5 w-32 animate-pulse rounded-full bg-border" />
          <div className="h-4 w-20 animate-pulse rounded-full bg-border" />
          <div className="flex w-full gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 flex-1 animate-pulse rounded-xl bg-border" />
            ))}
          </div>
        </div>
        {/* Section skeletons */}
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-surface p-4 shadow-sm">
            <div className="mb-3 h-5 w-40 animate-pulse rounded-full bg-border" />
            <div className="h-24 animate-pulse rounded-xl bg-border" />
          </div>
        ))}
      </div>
    );
  }

  /* ── Error ── */
  if (state === "error") {
    return wrap(
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <Icon name="circle-alert" size="xl" color="danger" decorative />
        <p className="text-[16px] font-bold text-text-primary">프로필을 불러오지 못했어요</p>
        <button
          type="button"
          className="rounded-full border border-border px-6 py-2 text-[14px] text-text-secondary"
        >
          다시 시도
        </button>
      </div>
    );
  }

  /* ── Default ── */
  const { name, handle, avatarUrl, verified, stats } = MOCK_USER;

  return wrap(
    <div className="flex flex-col gap-3 pb-6">
      {/* ── Profile card ── */}
      <div className="bg-surface px-4 pb-5 pt-5 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar
              size="xl"
              src={avatarUrl}
              alt={name}
              name={name}
              className="size-20 ring-2 ring-border"
            />
            <button
              type="button"
              aria-label="프로필 사진 변경"
              className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-surface ring-2 ring-border shadow-sm"
            >
              <Icon name="camera" size="xs" color="secondary" decorative />
            </button>
          </div>

          {/* Name + handle + profile link */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
            <p className="text-[10px] font-medium text-text-tertiary">내 프로필</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-bold text-text-primary">{name}</span>
              {verified && (
                <span className="flex size-[18px] items-center justify-center rounded-full bg-blue-500">
                  <Icon name="check" size="xs" color="white" decorative />
                </span>
              )}
              <Icon name="chevron-right" size="sm" color="inactive" decorative />
            </div>
            <p className="text-[13px] text-text-tertiary">@{handle}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex divide-x divide-border rounded-2xl bg-background-soft px-2 py-3">
          <StatItem icon="users-round" label="모임 참여" value={stats.joined} />
          <StatItem icon="calendar" label="모임 개최" value={stats.hosted} />
          <StatItem icon="heart" label="좋아요" value={stats.likes} />
        </div>
      </div>

      {/* ── 랜덤 추억 모임 ── */}
      <div className="bg-surface px-4 py-4 shadow-sm">
        {/* Section header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px]">✨</span>
            <span className="text-[14px] font-bold text-text-primary">랜덤 추억 모임</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 text-[12px] font-medium text-text-tertiary active:opacity-60"
          >
            <Icon name="refresh-cw" size="xs" color="inactive" decorative />
            다른 추억 보기
          </button>
        </div>

        {/* Memory card */}
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl bg-background-soft p-3 text-left ring-1 ring-border active:opacity-80"
        >
          <div className="relative size-[80px] shrink-0 overflow-hidden rounded-xl">
            <Image
              src={MOCK_MEMORY.imageUrl}
              alt={MOCK_MEMORY.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-text-primary">{MOCK_MEMORY.title}</p>
            <div className="mt-1 flex items-center gap-1">
              <Icon name="calendar" size="xs" color="inactive" decorative />
              <span className="text-[11px] text-text-tertiary">{MOCK_MEMORY.date}</span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-text-secondary">
              {MOCK_MEMORY.excerpt}
            </p>
          </div>
          <Icon name="chevron-right" size="sm" color="inactive" decorative />
        </button>
      </div>

      {/* ── Place log ── */}
      <div className="bg-surface px-4 py-4 shadow-sm">
        {/* Section header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px]">📍</span>
            <span className="text-[14px] font-bold text-text-primary">Place log</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-0.5 text-[12px] font-medium text-text-tertiary active:opacity-60"
          >
            자세히 보기
            <Icon name="external-link" size="xs" color="inactive" decorative />
          </button>
        </div>

        <MockMapSection />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Storybook meta & stories
───────────────────────────────────────────────────────── */
const meta: Meta<typeof MyPageScreen> = {
  title: "Pages/17 My Page/Page",
  component: MyPageScreen,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof MyPageScreen>;

export const Default: Story = {
  args: { state: "default" },
};

export const LoggedOut: Story = {
  args: { state: "loggedOut" },
};

export const Loading: Story = {
  args: { state: "loading" },
};

export const Error: Story = {
  args: { state: "error" },
};
