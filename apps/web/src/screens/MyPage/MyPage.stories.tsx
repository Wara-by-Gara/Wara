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
  id: "inv_hanok_2024",
  imageUrl: "https://placehold.co/120x120/D6E8D4/3D6B35?text=🌸",
  title: "한옥마을 봄나들이",
  date: "2024. 04. 13 (토)",
  excerpt: "따뜻한 봄날, 함께 걸었던 한옥마을의 추억 🌸",
};

/**
 * Place log — 한옥마을 봄나들이 모임 사진 GPS 메타데이터 mock.
 *
 * 실제 구현에서는 사진 EXIF/서버 메타데이터의 lat/lng 값을
 * 지도 뷰포트 bounding box 대비 상대 좌표(top%, left%)로 변환.
 *
 * 전주 한옥마을 뷰포트 예시:
 *   minLat: 35.808 / maxLat: 35.822
 *   minLng: 127.144 / maxLng: 127.158
 *
 * top%  = (maxLat - lat) / (maxLat - minLat) * 100
 * left% = (lng - minLng) / (maxLng - minLng) * 100
 */
const MEETING_PHOTOS: {
  id: string;
  src: string;
  caption: string;
  /** GPS 기반 지도 상 위치 (뷰포트 상대값) */
  top: string;
  left: string;
  likeCount: number;
}[] = [
  {
    id: "ph1",
    src: "https://placehold.co/80x80/C8E6C9/2E7D32?text=🌺",
    caption: "경기전 입구",
    // lat: 35.820, lng: 127.147 → top≈14%, left≈21%
    top: "14%",
    left: "21%",
    likeCount: 42,
  },
  {
    id: "ph2",
    src: "https://placehold.co/80x80/FFF9C4/F9A825?text=🏯",
    caption: "풍남문 광장",
    // lat: 35.812, lng: 127.145 → top≈71%, left≈7%
    top: "71%",
    left: "7%",
    likeCount: 31,
  },
  {
    id: "ph3",
    src: "https://placehold.co/80x80/FCE4EC/C2185B?text=🌸",
    caption: "한옥마을 골목",
    // lat: 35.815, lng: 127.152 → top≈50%, left≈57%
    top: "50%",
    left: "57%",
    likeCount: 38,
  },
  {
    id: "ph4",
    src: "https://placehold.co/80x80/E3F2FD/1565C0?text=☕",
    caption: "전동성당 앞 카페",
    // lat: 35.819, lng: 127.155 → top≈21%, left≈79%
    top: "21%",
    left: "79%",
    likeCount: 25,
  },
  {
    id: "ph5",
    src: "https://placehold.co/80x80/F3E5F5/6A1B9A?text=🍃",
    caption: "오목대 전망",
    // lat: 35.809, lng: 127.157 → top≈93%, left≈93%
    top: "82%",
    left: "88%",
    likeCount: 19,
  },
];

/* ─────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────── */
function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5">
      <span className="text-[15px] font-bold text-text-primary">{value}</span>
      <span className="text-[11px] text-text-tertiary">{label}</span>
    </div>
  );
}

/**
 * Place log 지도 mock.
 * 실제 구현에서는 Kakao/Google Map 위에 각 사진의 GPS 좌표를 마커로 렌더링.
 * 여기서는 뷰포트 내 상대 좌표(top/left %)로 사진 핀을 배치해 동일 UX를 시뮬레이션.
 */
function PlaceLogMap() {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-border">
      {/* 선택된 모임 레이블 */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface px-3 py-2">
        <div className="relative size-5 overflow-hidden rounded-md">
          <Image
            src={MOCK_MEMORY.imageUrl}
            alt={MOCK_MEMORY.title}
            fill
            className="object-cover"
          />
        </div>
        <span className="text-[12px] font-medium text-text-primary">{MOCK_MEMORY.title}</span>
        <span className="ml-auto text-[11px] text-text-tertiary">
          사진 {MEETING_PHOTOS.length}장
        </span>
      </div>

      {/* 지도 영역 */}
      <div className="relative h-[200px] bg-[#E8F0E4]">
        {/* 도로망 SVG mock */}
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 주요 도로 */}
          <line x1="0" y1="58%" x2="100%" y2="54%" stroke="#8FA88A" strokeWidth="7" />
          <line x1="0" y1="72%" x2="100%" y2="68%" stroke="#A5BFA0" strokeWidth="4" />
          {/* 세로 도로 */}
          <line x1="32%" y1="0" x2="35%" y2="100%" stroke="#8FA88A" strokeWidth="5" />
          <line x1="65%" y1="0" x2="67%" y2="100%" stroke="#A5BFA0" strokeWidth="3" />
          {/* 골목길 */}
          <line x1="10%" y1="30%" x2="60%" y2="25%" stroke="#B8CEB4" strokeWidth="2" />
          <line x1="40%" y1="0" x2="42%" y2="55%" stroke="#B8CEB4" strokeWidth="2" />
          <line x1="70%" y1="40%" x2="100%" y2="38%" stroke="#B8CEB4" strokeWidth="2" />
          {/* 강/공원 */}
          <ellipse cx="50%" cy="85%" rx="45%" ry="8%" fill="#C5DDF5" opacity="0.5" />
        </svg>

        {/* GPS 기반 사진 핀 */}
        {MEETING_PHOTOS.map((photo) => (
          <div
            key={photo.id}
            className="absolute flex flex-col items-center"
            style={{
              top: photo.top,
              left: photo.left,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            {/* 사진 썸네일 핀 */}
            <div className="relative size-[52px] overflow-hidden rounded-xl border-[2.5px] border-white shadow-lg">
              <Image src={photo.src} alt={photo.caption} fill className="object-cover" />
            </div>
            {/* 핀 꼬리 */}
            <div className="h-1.5 w-0.5 bg-white/80" />
            {/* 위치 라벨 */}
            <div className="whitespace-nowrap rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-medium text-text-secondary shadow-sm">
              {photo.caption}
            </div>
          </div>
        ))}
      </div>
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
  const wrap = (children: React.ReactNode) => (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-hidden bg-background-soft">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        <span className="text-[17px] font-bold text-text-primary">마이페이지</span>
        <button type="button" aria-label="설정" className="inline-flex size-9 items-center justify-center">
          <Icon name="settings" size="md" color="secondary" decorative />
        </button>
      </div>
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
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
        <Icon name="alert-circle" size="xl" color="danger" decorative />
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
      {/* ── 프로필 카드 ── */}
      <div className="bg-surface px-4 pb-5 pt-5 shadow-sm">
        <div className="flex items-start gap-4">
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
              className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-surface shadow-sm ring-2 ring-border"
            >
              <Icon name="camera" size="xs" color="secondary" decorative />
            </button>
          </div>
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

        {/* 통계 */}
        <div className="mt-4 flex divide-x divide-border rounded-2xl bg-background-soft px-2 py-3">
          <StatItem label="모임 참여" value={stats.joined} />
          <StatItem label="모임 개최" value={stats.hosted} />
          <StatItem label="좋아요" value={stats.likes} />
        </div>
      </div>

      {/* ── 랜덤 추억 모임 ── */}
      <div className="bg-surface px-4 py-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px]">✨</span>
            <span className="text-[14px] font-bold text-text-primary">랜덤 추억 모임</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 text-[12px] font-medium text-text-tertiary active:opacity-60"
          >
            <Icon name="rotate-cw" size="xs" color="inactive" decorative />
            다른 추억 보기
          </button>
        </div>

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

        {/* 선택 모임의 GPS 메타데이터 기반 사진 지도 */}
        <PlaceLogMap />
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
