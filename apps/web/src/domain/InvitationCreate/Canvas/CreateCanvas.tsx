"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { Textarea } from "@/components/primitives/Textarea";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { InvitationAnimation } from "../InvitationAnimation";
import { DESIGN_FONTS, fontStyle } from "@/domain/InvitationCreate/constants";
import type { DesignFont, RsvpType, RsvpOption, AnimationId } from "@/domain/InvitationCreate/constants";

export interface CreateCanvasProps {
  /* 제목 */
  title: string;
  onTitleChange: (v: string) => void;
  titleError: boolean;
  titleFocused: boolean;
  onTitleFocus: () => void;
  /* 폰트 */
  designFont: DesignFont;
  onFontChange: (f: DesignFont) => void;
  /* 대표 이미지 */
  coverImageUrl?: string;
  coverGifUrl?: string;
  imageError: boolean;
  onEditImage: () => void;
  /* 날짜·시간 */
  dateText?: string;
  dateError: boolean;
  onEditDate: () => void;
  timeText?: string;
  timeUnknown?: boolean;
  onTimeUnknownChange?: (v: boolean) => void;
  /* 장소 */
  placeText?: string;
  locationError: boolean;
  onEditLocation: () => void;
  /* 소개 */
  description: string;
  onDescriptionChange: (v: string) => void;
  /* RSVP */
  rsvp: Record<RsvpType, RsvpOption>;
  onEditRsvp: () => void;
  /* 배경색 & 애니메이션 */
  bgClass: string;
  animation: AnimationId;
  onEditDesign: () => void;
}

function EditableRow({
  icon,
  text,
  placeholder,
  error,
  onClick,
}: {
  icon: IconName;
  text?: string;
  placeholder: string;
  error?: boolean;
  onClick: () => void;
}) {
  const filled = !!text;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md border px-4 py-3.5 text-left transition-colors",
        "bg-surface/60 backdrop-blur hover:bg-gray-50 transition-colors duration-150",
        error ? "border-danger" : "border-border/50",
      )}
    >
      <Icon name={icon} size="sm" color={error ? "danger" : "primary"} decorative />
      <span
        className={cn(
          "flex-1 text-[15px]",
          filled ? "text-text-primary" : error ? "text-danger" : "text-text-tertiary",
        )}
      >
        {text || placeholder}
      </span>
      <Icon name="chevron-right" size="sm" color="inactive" decorative />
    </button>
  );
}

export function CreateCanvas({
  title,
  onTitleChange,
  titleError,
  titleFocused,
  onTitleFocus,
  designFont,
  onFontChange,
  coverImageUrl,
  coverGifUrl,
  imageError,
  onEditImage,
  dateText,
  dateError,
  onEditDate,
  timeText,
  timeUnknown,
  onTimeUnknownChange,
  placeText,
  locationError,
  onEditLocation,
  description,
  onDescriptionChange,
  rsvp,
  onEditRsvp,
  bgClass,
  animation,
  onEditDesign,
}: CreateCanvasProps) {
  const hasCover = !!coverImageUrl || !!coverGifUrl;

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg font-pretendard",
        bgClass,
      )}
    >
      <InvitationAnimation effect={animation} className="absolute inset-0 z-[1]" />

      <main className="relative z-[2] flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page pb-6 pt-4">
      {/* 대표 이미지 — 클릭/편집 버튼으로 시트 진입 */}
      <div className="relative">
        {hasCover ? (
          <button type="button" className="w-full" onClick={onEditImage} aria-label="대표 이미지 편집">
            <InvitationCover
              variant="image"
              imageUrl={coverImageUrl}
              gifUrl={coverGifUrl}
              fitToImage
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={onEditImage}
            className={cn(
              "flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed",
              imageError ? "border-danger bg-danger-soft" : "border-border-strong/60 bg-surface/40 backdrop-blur",
            )}
          >
            <Icon name="image" size="xl" color={imageError ? "danger" : "inactive"} decorative />
            <span className={cn("text-[13px]", imageError ? "text-danger" : "text-text-tertiary")}>
              {imageError ? "대표 이미지를 추가해주세요" : "사진이나 GIF를 추가해보세요"}
            </span>
          </button>
        )}
        {hasCover && (
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-[12px] font-semibold text-white">
            <Icon name="edit" size="xs" color="currentColor" decorative /> 편집
          </span>
        )}
      </div>

      {/* 제목 — 투명 인풋 (배경 비침) + 폰트 즉시 반영 */}
      <div className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onFocus={onTitleFocus}
          placeholder="초대장 제목"
          maxLength={10}
          aria-label="모임 이름"
          className={cn(
            "w-full bg-transparent text-center text-[32px] font-extrabold leading-snug text-text-primary outline-none",
            "placeholder:text-text-tertiary/50",
            fontStyle(designFont),
          )}
        />
        {titleError && (
          <p className="text-center text-[13px] text-danger">모임 이름을 입력해주세요</p>
        )}
        {titleFocused && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DESIGN_FONTS.map(({ id, label, style }) => (
              <button
                key={id}
                type="button"
                onClick={() => onFontChange(id)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-1 rounded-md border-2 px-3 py-2.5 transition-colors",
                  designFont === id ? "border-primary bg-primary-soft" : "border-border/60 bg-surface/70",
                )}
              >
                <span className={cn("text-[20px] leading-tight", style, designFont === id ? "text-primary" : "text-text-primary")}>
                  가나다
                </span>
                <span className={cn("whitespace-nowrap text-[11px]", designFont === id ? "font-semibold text-primary" : "text-text-secondary")}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 날짜 / 장소 */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <EditableRow
              icon="calendar"
              text={dateText}
              placeholder="날짜·시간을 정해주세요"
              error={dateError}
              onClick={onEditDate}
            />
          </div>
          {timeText && !timeUnknown && (
            <div className="relative flex-1">
              <button
                type="button"
                onClick={onEditDate}
                className="flex h-full w-full items-center gap-2.5 rounded-md border border-border/50 bg-surface/60 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
              >
                <Icon name="clock" size="sm" color="primary" decorative />
                <span className="flex-1 text-[15px] text-text-primary">{timeText}</span>
              </button>
              <span className="absolute right-2 top-1 text-[10px] font-bold text-primary">ON</span>
            </div>
          )}
          {timeUnknown && (
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => onTimeUnknownChange?.(false)}
                className="flex h-full w-full items-center justify-center rounded-md border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-gray-50"
                title="시작 시간 설정"
              >
                <Icon name="plus" size="sm" color="inactive" decorative />
              </button>
              <span className="absolute right-2 top-1 text-[10px] font-bold text-text-tertiary">OFF</span>
            </div>
          )}
        </div>
        <EditableRow
          icon="map-pin"
          text={placeText}
          placeholder="장소를 입력하세요"
          error={locationError}
          onClick={onEditLocation}
        />
      </div>

      {/* 소개 — 투명 textarea */}
      <Textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="모임 소개를 적어주세요"
        rows={3}
        maxLength={500}
        className="border-border/50 bg-surface/40 backdrop-blur"
      />

      {/* RSVP (탭하면 편집) */}
      <button
        type="button"
        onClick={onEditRsvp}
        className="mt-auto block w-full"
      >
        <div className="grid grid-cols-3 gap-2 pt-2">
          {(["attending", "maybe", "declined"] as RsvpType[]).map((type) => (
            <div
              key={type}
              className="flex flex-col items-center gap-1.5 rounded-md border border-border/50 bg-surface/70 px-3 py-3 backdrop-blur hover:bg-surface transition-colors"
            >
              <span className="text-[26px] leading-none">{rsvp[type].emoji}</span>
              <span className="text-[13px] text-text-secondary">{rsvp[type].label}</span>
            </div>
          ))}
        </div>
      </button>

      {/* 디자인 버튼 (배경색·애니메이션) */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <button
          type="button"
          onClick={onEditDesign}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-white/20 px-3 py-2 text-[13px] font-semibold text-text-primary transition-colors hover:bg-white/30 backdrop-blur"
        >
          <Icon name="palette" size="sm" color="currentColor" decorative />
          디자인
        </button>
      </div>
    </main>
    </div>
  );
}
