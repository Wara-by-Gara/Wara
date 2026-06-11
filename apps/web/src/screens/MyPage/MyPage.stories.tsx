import { useState } from "react";
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
  // picsum seed → 항상 동일한 이미지
  imageUrl: "https://picsum.photos/seed/hanok-cover/120/120",
  title: "한옥마을 봄나들이",
  date: "2024. 04. 13 (토)",
  excerpt: "따뜻한 봄날, 함께 걸었던 한옥마을의 추억 🌸",
};

/**
 * Place log — 한옥마을 봄나들이 모임 사진 GPS 메타데이터 mock.
 *
 * 실제 구현에서는 사진 EXIF / 서버 메타데이터의 lat/lng 를
 * 지도 뷰포트 bounding box 대비 상대 좌표(top%, left%)로 변환.
 *
 * 전주 한옥마을 뷰포트:
 *   minLat: 35.808 / maxLat: 35.822
 *   minLng: 127.144 / maxLng: 127.158
 *
 *   top%  = (maxLat - lat) / (maxLat - minLat) × 100
 *   left% = (lng - minLng) / (maxLng - minLng) × 100
 */
interface MeetingPhoto {
  id: string;
  /** 썸네일 (지도 핀 + 리스트) */
  thumb: string;
  /** 모달 확대 이미지 */
  full: string;
  caption: string;
  address: string;
  takenAt: string;
  gps: string;
  top: string;
  left: string;
  likeCount: number;
}

const MEETING_PHOTOS: MeetingPhoto[] = [
  {
    id: "ph1",
    thumb: "https://picsum.photos/seed/hanok-gate/160/160",
    full: "https://picsum.photos/seed/hanok-gate/800/800",
    caption: "경기전 입구",
    address: "전북 전주시 완산구 태조로 44",
    takenAt: "2024. 04. 13 · 오전 10:12",
    gps: "35.8197° N, 127.1472° E",
    top: "14%",
    left: "21%",
    likeCount: 42,
  },
  {
    id: "ph2",
    thumb: "https://picsum.photos/seed/hanok-gate2/160/160",
    full: "https://picsum.photos/seed/hanok-gate2/800/800",
    caption: "풍남문 광장",
    address: "전북 전주시 완산구 풍남문3길 1",
    takenAt: "2024. 04. 13 · 오전 11:38",
    gps: "35.8116° N, 127.1455° E",
    top: "71%",
    left: "7%",
    likeCount: 31,
  },
  {
    id: "ph3",
    thumb: "https://picsum.photos/seed/hanok-alley/160/160",
    full: "https://picsum.photos/seed/hanok-alley/800/800",
    caption: "한옥마을 골목",
    address: "전북 전주시 완산구 은행로 55",
    takenAt: "2024. 04. 13 · 오후 12:55",
    gps: "35.8154° N, 127.1522° E",
    top: "50%",
    left: "57%",
    likeCount: 38,
  },
  {
    id: "ph4",
    thumb: "https://picsum.photos/seed/hanok-cafe/160/160",
    full: "https://picsum.photos/seed/hanok-cafe/800/800",
    caption: "전동성당 앞 카페",
    address: "전북 전주시 완산구 태조로 51",
    takenAt: "2024. 04. 13 · 오후 02:10",
    gps: "35.8192° N, 127.1551° E",
    top: "21%",
    left: "79%",
    likeCount: 25,
  },
  {
    id: "ph5",
    thumb: "https://picsum.photos/seed/hanok-view/160/160",
    full: "https://picsum.photos/seed/hanok-view/800/800",
    caption: "오목대 전망",
    address: "전북 전주시 완산구 기린대로 55",
    takenAt: "2024. 04. 13 · 오후 03:47",
    gps: "35.8094° N, 127.1574° E",
    top: "82%",
    left: "88%",
    likeCount: 19,
  },
];

/* ─────────────────────────────────────────────────────────
   Photo Modal
───────────────────────────────────────────────────────── */
function PhotoModal({
  photo,
  onClose,
}: {
  photo: MeetingPhoto;
  onClose: () => void;
}) {
  return (
    /* backdrop */
    <div
      className="absolute inset-0 z-50 flex flex-col bg-black/80"
      onClick={onClose}
    >
      {/* header */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-white">{photo.caption}</span>
          <span className="text-[11px] text-white/60">{photo.takenAt}</span>
        </div>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-white/10"
        >
          <Icon name="close" size="sm" color="white" decorative />
        </button>
      </div>

      {/* 확대 사진 */}
      <div
        className="relative min-h-0 flex-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.full}
          alt={photo.caption}
          fill
          className="object-contain"
          sizes="(max-width: 480px) 100vw, 480px"
        />
      </div>

      {/* footer — 위치 & 좋아요 */}
      <div
        className="shrink-0 px-4 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <Icon name="map-pin" size="sm" color="white" decorative />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-white">{photo.address}</p>
              <p className="mt-0.5 text-[11px] text-white/50">{photo.gps}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 border-t border-white/10 pt-2">
            <Icon name="heart" size="xs" color="white" decorative />
            <span className="text-[12px] font-medium text-white">{photo.likeCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Place log — 지도 + 상세 목록
───────────────────────────────────────────────────────── */
function PlaceLogSection({ onSelectPhoto }: { onSelectPhoto: (p: MeetingPhoto) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {/* ── 지도 + GPS 핀 ── */}
      <div className="overflow-hidden rounded-2xl ring-1 ring-border">
        {/* 선택된 모임 레이블 */}
        <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
          <div className="relative size-5 shrink-0 overflow-hidden rounded-md">
            <Image
              src={MOCK_MEMORY.imageUrl}
              alt={MOCK_MEMORY.title}
              fill
              className="object-cover"
            />
          </div>
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-text-primary">
            {MOCK_MEMORY.title}
          </span>
          <span className="shrink-0 text-[11px] text-text-tertiary">
            사진 {MEETING_PHOTOS.length}장
          </span>
        </div>

        {/* 지도 영역 */}
        <div className="relative h-[210px] bg-[#E8F0E4]">
          {/* 도로망 SVG mock */}
          <svg className="absolute inset-0 h-full w-full opacity-25" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="58%" x2="100%" y2="54%" stroke="#8FA88A" strokeWidth="7" />
            <line x1="0" y1="72%" x2="100%" y2="68%" stroke="#A5BFA0" strokeWidth="4" />
            <line x1="32%" y1="0" x2="35%" y2="100%" stroke="#8FA88A" strokeWidth="5" />
            <line x1="65%" y1="0" x2="67%" y2="100%" stroke="#A5BFA0" strokeWidth="3" />
            <line x1="10%" y1="30%" x2="60%" y2="25%" stroke="#B8CEB4" strokeWidth="2" />
            <line x1="40%" y1="0" x2="42%" y2="55%" stroke="#B8CEB4" strokeWidth="2" />
            <line x1="70%" y1="40%" x2="100%" y2="38%" stroke="#B8CEB4" strokeWidth="2" />
            <ellipse cx="50%" cy="87%" rx="45%" ry="7%" fill="#C5DDF5" opacity="0.5" />
          </svg>

          {/* GPS 기반 사진 핀 — 클릭 가능 */}
          {MEETING_PHOTOS.map((photo) => (
            <button
              key={photo.id}
              type="button"
              aria-label={`${photo.caption} 사진 보기`}
              onClick={() => onSelectPhoto(photo)}
              className="absolute flex flex-col items-center active:scale-95"
              style={{
                top: photo.top,
                left: photo.left,
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              <div className="relative size-[52px] overflow-hidden rounded-xl border-[2.5px] border-white shadow-lg">
                <Image
                  src={photo.thumb}
                  alt={photo.caption}
                  fill
                  className="object-cover"
                  sizes="52px"
                />
              </div>
              {/* 핀 꼬리 */}
              <div className="h-1.5 w-0.5 bg-white/80" />
              <div className="whitespace-nowrap rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-medium text-text-secondary shadow-sm">
                {photo.caption}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 상세 사진 목록 ── */}
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
        {MEETING_PHOTOS.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => onSelectPhoto(photo)}
            className="flex items-center gap-3 px-3 py-3 text-left active:bg-background-soft"
          >
            {/* 썸네일 */}
            <div className="relative size-[56px] shrink-0 overflow-hidden rounded-xl">
              <Image
                src={photo.thumb}
                alt={photo.caption}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>

            {/* 정보 */}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-text-primary">{photo.caption}</p>
              <div className="mt-0.5 flex items-center gap-1">
                <Icon name="map-pin" size="xs" color="inactive" decorative />
                <p className="truncate text-[11px] text-text-tertiary">{photo.address}</p>
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <Icon name="clock" size="xs" color="inactive" decorative />
                <p className="text-[11px] text-text-tertiary">{photo.takenAt}</p>
              </div>
            </div>

            {/* 좋아요 */}
            <div className="flex shrink-0 flex-col items-center gap-0.5">
              <Icon name="heart" size="sm" color="inactive" decorative />
              <span className="text-[11px] text-text-tertiary">{photo.likeCount}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

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
            <span className={`text-[10px] font-medium ${isActive ? "text-brand" : "text-text-tertiary"}`}>
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
  const [selectedPhoto, setSelectedPhoto] = useState<MeetingPhoto | null>(null);

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

      {/* 사진 확대 모달 */}
      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
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
              sizes="80px"
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

        {/* 지도 + 상세 목록 */}
        <PlaceLogSection onSelectPhoto={setSelectedPhoto} />
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
