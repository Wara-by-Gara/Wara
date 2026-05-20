"use client";

import Image from "next/image";

interface InvitationPreviewProps {
  coverImageUrl: string | null;
  eventTitle: string;
  date: string;
  time: string;
  location: string;
}

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export default function InvitationPreview({
  coverImageUrl,
  eventTitle,
  date,
  time,
  location,
}: InvitationPreviewProps) {
  const hasDate = date.length > 0;
  const hasTime = time.length > 0;
  const dateTimeText = [date, time].filter(Boolean).join(" • ");

  return (
    <div className="flex flex-col items-start gap-3 w-full">
      <p className="text-xs font-bold tracking-widest text-[#505f78]">LIVE PREVIEW</p>

      {/* 카드 — Figma: 512x1081, 이미지 4:5 비율 */}
      <div className="w-full max-w-[512px] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.14)] overflow-hidden bg-white">

        {/* 커버 이미지 — 4:5 비율 */}
        <div className="relative w-full aspect-[4/5] bg-[#e4e2e2]">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt="cover"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#b0a8a5" strokeWidth="0.8">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
          {/* PRIVATE EVENT 배지 */}
          <div className="absolute bottom-4 left-4 bg-[#a73921]/90 px-3 py-1 rounded-sm">
            <span className="text-white text-xs font-normal tracking-widest">PRIVATE EVENT</span>
          </div>
        </div>

        {/* 카드 본문 */}
        <div className="px-8 pt-6 pb-10 flex flex-col gap-4">
          <p className="font-serif text-[#a73921] text-3xl font-semibold italic leading-snug">
            Warm Welcome
          </p>

          <h2 className="font-serif text-[#1b1c1c] text-4xl font-bold leading-tight">
            {eventTitle || "Event Title"}
          </h2>

          <div className="w-20 h-px bg-[#dfc0b9]" />

          <div className="flex flex-col gap-3 text-[#505f78] text-lg">
            {(hasDate || hasTime) ? (
              <div className="flex items-center gap-2">
                <CalendarIcon />
                <span>{dateTimeText}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#6b7280]">
                <CalendarIcon />
                <span>Date &amp; time</span>
              </div>
            )}
            {location ? (
              <div className="flex items-center gap-2">
                <PinIcon />
                <span>{location}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#6b7280]">
                <PinIcon />
                <span>Location</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
