/**
 * Place Log — 17 My Page 하위 독립 섹션
 *
 * - PlaceLogView: 지도 + 사진 목록 전체 화면 (Default 스토리)
 * - PlaceLogPhotoModal: 사진 선택 시 확대 모달 컴포넌트 (Modal Open 스토리)
 *
 * 실제 구현에서 PhotoModal 은 별도 컴포넌트로 분리하여
 * MyPage 화면과 PlaceLog 상세 화면 모두에서 재사용.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Image from "next/image";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";
import { Icon } from "@/components/icons";

/* ─────────────────────────────────────────────────────────
   Shared types & mock data
───────────────────────────────────────────────────────── */
export interface PlacePhoto {
  id: string;
  /** 썸네일 (지도 핀 + 목록) */
  thumb: string;
  /** 모달 확대용 고해상도 */
  full: string;
  caption: string;
  address: string;
  takenAt: string;
  gps: string;
  /** 지도 뷰포트 상대 위치 */
  top: string;
  left: string;
  likeCount: number;
}

const MEETING = {
  imageUrl: "https://picsum.photos/seed/hanok-cover/120/120",
  title: "한옥마을 봄나들이",
  date: "2024. 04. 13 (토)",
};

export const PLACE_PHOTOS: PlacePhoto[] = [
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
   PhotoModal — 별도 컴포넌트
   지도 또는 목록에서 사진 선택 시 fullscreen 확대 표시.
   onClose: 배경 탭 or X 버튼 클릭 시 호출.
───────────────────────────────────────────────────────── */
export function PhotoModal({
  photo,
  onClose,
}: {
  photo: PlacePhoto;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.caption} 사진 확대`}
      className="absolute inset-0 z-50 flex flex-col bg-black/90"
      onClick={onClose}
    >
      {/* ── 헤더 ── */}
      <div
        className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <span className="text-[16px] font-bold text-white">{photo.caption}</span>
          <span className="text-[12px] text-white/60">{photo.takenAt}</span>
        </div>

        {/* X 버튼 — 흰 배경 + 어두운 아이콘으로 최대 대비 */}
        <button
          type="button"
          aria-label="사진 닫기"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-white shadow-lg transition-opacity active:opacity-70"
        >
          <Icon name="close" size="md" color="default" decorative />
        </button>
      </div>

      {/* ── 확대 사진 ── */}
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
          priority
        />
      </div>

      {/* ── 하단 정보 카드 ── */}
      <div
        className="shrink-0 px-4 pb-6 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20">
          {/* 위치 */}
          <div className="flex items-start gap-2.5">
            <Icon name="map-pin" size="sm" color="inverse" decorative />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-white">{photo.address}</p>
              <p className="mt-0.5 text-[11px] font-mono text-white/50">{photo.gps}</p>
            </div>
          </div>

          <div className="my-3 h-px bg-white/10" />

          {/* 좋아요 */}
          <div className="flex items-center gap-1.5">
            <Icon name="heart" size="sm" color="inverse" decorative />
            <span className="text-[13px] font-medium text-white">{photo.likeCount}</span>
            <span className="text-[12px] text-white/50">명이 좋아해요</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Place Log 지도 섹션
───────────────────────────────────────────────────────── */
function PlaceLogMap({ onSelect }: { onSelect: (p: PlacePhoto) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-border">
      {/* 모임 레이블 */}
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <div className="relative size-5 shrink-0 overflow-hidden rounded-md">
          <Image src={MEETING.imageUrl} alt={MEETING.title} fill className="object-cover" />
        </div>
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-text-primary">
          {MEETING.title}
        </span>
        <span className="shrink-0 text-[11px] text-text-tertiary">
          사진 {PLACE_PHOTOS.length}장
        </span>
      </div>

      {/* 지도 영역 */}
      <div className="relative h-[220px] bg-[#E8F0E4]">
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

        {PLACE_PHOTOS.map((photo) => (
          <button
            key={photo.id}
            type="button"
            aria-label={`${photo.caption} 사진 보기`}
            onClick={() => onSelect(photo)}
            className="absolute flex flex-col items-center transition-transform active:scale-95"
            style={{ top: photo.top, left: photo.left, transform: "translate(-50%, -50%)", zIndex: 10 }}
          >
            <div className="relative size-[52px] overflow-hidden rounded-xl border-[2.5px] border-white shadow-lg">
              <Image src={photo.thumb} alt={photo.caption} fill className="object-cover" sizes="52px" />
            </div>
            <div className="h-1.5 w-0.5 bg-white/80" />
            <div className="whitespace-nowrap rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-medium text-text-secondary shadow-sm">
              {photo.caption}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Place Log 사진 목록
───────────────────────────────────────────────────────── */
function PlaceLogPhotoList({ onSelect }: { onSelect: (p: PlacePhoto) => void }) {
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
      {PLACE_PHOTOS.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onSelect(photo)}
          className="flex items-center gap-3 px-3 py-3 text-left transition-colors active:bg-background-soft"
        >
          <div className="relative size-[56px] shrink-0 overflow-hidden rounded-xl">
            <Image src={photo.thumb} alt={photo.caption} fill className="object-cover" sizes="56px" />
          </div>
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
          <div className="flex shrink-0 flex-col items-center gap-0.5">
            <Icon name="heart" size="sm" color="inactive" decorative />
            <span className="text-[11px] text-text-tertiary">{photo.likeCount}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Place Log View — 전체 화면 컴포넌트
───────────────────────────────────────────────────────── */
interface PlaceLogViewProps {
  /** 특정 사진 ID를 초기 선택 상태로 열기 (모달 미리보기용) */
  initialPhotoId?: string;
}

function PlaceLogView({ initialPhotoId }: PlaceLogViewProps) {
  const initial = initialPhotoId
    ? (PLACE_PHOTOS.find((p) => p.id === initialPhotoId) ?? null)
    : null;
  const [selectedPhoto, setSelectedPhoto] = useState<PlacePhoto | null>(initial);

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-hidden bg-background-soft">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <button type="button" aria-label="뒤로가기" className="flex size-9 items-center justify-center">
          <Icon name="chevron-left" size="md" color="default" decorative />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[16px] font-bold text-text-primary">Place log</span>
          <span className="text-[11px] text-text-tertiary">{MEETING.title} · {MEETING.date}</span>
        </div>
      </div>

      {/* Content */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4 pb-8">
          {/* 안내 텍스트 */}
          <p className="text-[12px] text-text-tertiary">
            모임에서 찍은 사진의 GPS 메타데이터를 기반으로 촬영 위치를 지도에 표시합니다.
            사진을 탭하면 확대해서 볼 수 있어요.
          </p>

          {/* 지도 */}
          <PlaceLogMap onSelect={setSelectedPhoto} />

          {/* 사진 목록 */}
          <div className="flex items-center gap-1.5 px-0.5 pt-1">
            <Icon name="images" size="sm" color="inactive" decorative />
            <span className="text-[13px] font-bold text-text-primary">사진 목록</span>
          </div>
          <PlaceLogPhotoList onSelect={setSelectedPhoto} />
        </div>
      </main>

      {/* PhotoModal — 사진 확대 모달 (별도 컴포넌트) */}
      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Storybook meta & stories
───────────────────────────────────────────────────────── */
const meta: Meta<typeof PlaceLogView> = {
  title: "Pages/17 My Page/Place Log",
  component: PlaceLogView,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof PlaceLogView>;

/** 지도 + 사진 목록 기본 뷰 */
export const Default: Story = {};

/** 지도 핀 선택 → 사진 확대 모달 열린 상태 */
export const PhotoModalOpen: Story = {
  args: { initialPhotoId: "ph3" },
  name: "Photo Modal Open",
};
