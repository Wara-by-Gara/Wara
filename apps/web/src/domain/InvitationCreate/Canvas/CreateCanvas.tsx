'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/icons';
import type { IconName } from '@/components/icons';
import { Textarea } from "@wara/ui";
import { InvitationCover } from '@/components/domain';
import { DESIGN_FONTS, fontStyle } from '@/domain/InvitationCreate/constants';
import type {
  DesignFont,
  RsvpType,
  RsvpOption,
  AnimationId,
} from '@/domain/InvitationCreate/constants';

function formatTimeKorean(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const ampm = h < 12 ? '오전' : '오후';
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return m === 0 ? `${ampm} ${hour}시` : `${ampm} ${hour}시 ${m}분`;
}

export interface CreateCanvasProps {
  /* 제목 */
  title: string;
  onTitleChange: (v: string) => void;
  titleError: boolean;
  titleFocused: boolean;
  onTitleFocus: () => void;
  onTitleBlur: () => void;
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
  /* 장소 */
  placeText?: string;
  locationError: boolean;
  onEditLocation: () => void;
  locationUnknown?: boolean;
  /* 모임 옵션 (회비·드레스코드·주차) */
  optionsText?: string;
  onEditOptions: () => void;
  /* 소개 */
  description: string;
  onDescriptionChange: (v: string) => void;
  /* RSVP */
  rsvp: Record<RsvpType, RsvpOption>;
  onEditRsvp: () => void;
  /* 배경색 & 애니메이션 */
  bgClass: string;
  animation: AnimationId;
  onEditBgColor: () => void;
  onEditAnimation: () => void;
}

function EditableRow({
  icon,
  text,
  placeholder,
  error,
  onClick,
  isDarkBg,
}: {
  icon: IconName;
  text?: string;
  placeholder: string;
  error?: boolean;
  onClick: () => void;
  isDarkBg?: boolean;
}) {
  const filled = !!text;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md border px-4 py-3.5 text-left transition-colors',
        'bg-[#dadada2b] backdrop-blur hover:bg-gray-50 transition-colors duration-150',
        error ? 'border-danger' : 'border-border/50',
      )}
    >
      <Icon
        name={icon}
        size="sm"
        color={error ? 'danger' : 'default'}
        decorative
      />
      <span
        className={cn(
          'flex-1 text-[15px]',
          filled
            ? isDarkBg ? 'text-white' : 'text-text'
            : error
              ? 'text-danger'
              : isDarkBg ? 'text-white/70' : 'text-text-disabled',
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
  onTitleBlur,
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
  placeText,
  locationError,
  onEditLocation,
  locationUnknown,
  optionsText,
  onEditOptions,
  description,
  onDescriptionChange,
  rsvp,
  onEditRsvp,
  bgClass,
  animation,
  onEditBgColor,
  onEditAnimation,
}: CreateCanvasProps) {
  const hasCover = !!coverImageUrl || !!coverGifUrl;

  // 제목 textarea 자동 높이 — 내용에 따라 1~2줄(max-h로 상한)
  const titleRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [title, designFont]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          'relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg font-pretendard',
          bgClass,
        )}
      >
        <main className="relative z-[2] flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page pb-6 pt-4">
        {/* 대표 이미지 — 클릭/편집 버튼으로 시트 진입 */}
        <div className="relative">
          {hasCover ? (
            <button
              type="button"
              className="w-full"
              onClick={onEditImage}
              aria-label="대표 이미지 편집"
            >
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
                'flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed',
                imageError
                  ? 'border-danger bg-danger-soft'
                  : 'border-border-strong/60 bg-surface/40 backdrop-blur',
              )}
            >
              <Icon
                name="image"
                size="xl"
                color={imageError ? 'danger' : 'inactive'}
                decorative
              />
              <span
                className={cn(
                  'text-[13px]',
                  imageError
                    ? 'text-danger'
                    : bgClass.includes('aurora') || bgClass.includes('starry')
                      ? 'text-white/70'
                      : 'text-text-disabled',
                )}
              >
                {imageError
                  ? '대표 이미지를 추가해주세요'
                  : '사진이나 GIF를 추가해보세요'}
              </span>
            </button>
          )}
          {hasCover && (
            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-[12px] font-semibold text-white">
              <Icon name="edit" size="xs" color="currentColor" decorative />{' '}
              편집
            </span>
          )}
        </div>

        {/* 제목 — 투명 인풋 (배경 비침) + 폰트 즉시 반영 */}
        <div className="flex flex-col gap-2">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onFocus={onTitleFocus}
            onBlur={onTitleBlur}
            placeholder="초대장 제목"
            maxLength={20}
            rows={1}
            aria-label="모임 이름"
            className={cn(
              // resize-none + overflow-hidden + max-h-[2.75em](leading-snug 1.375 × 2줄) → 최대 2줄
              'w-full resize-none overflow-hidden bg-transparent text-left text-[32px] font-extrabold leading-snug outline-none max-h-[2.75em]',
              bgClass.includes('aurora') || bgClass.includes('starry')
                ? 'text-white placeholder:text-white/50'
                : 'text-text placeholder:text-text-disabled/50',
              fontStyle(designFont),
            )}
          />
          {titleError && (
            <p className="text-left text-[13px] text-danger">
              모임 이름을 입력해주세요
            </p>
          )}
          {titleFocused && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DESIGN_FONTS.map(({ id, label, style }) => (
                <button
                  key={id}
                  type="button"
                  // mousedown 시 preventDefault → textarea 포커스 유지(blur로 폰트픽커 닫히지 않게)
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onFontChange(id)}
                  className={cn(
                    'flex shrink-0 flex-col items-center gap-1 rounded-md border-2 px-3 py-2.5 transition-colors',
                    designFont === id
                      ? 'border-primary bg-primary-soft'
                      : 'border-border/60 bg-surface/70',
                  )}
                >
                  <span
                    className={cn(
                      'text-[20px] leading-tight',
                      style,
                      designFont === id ? 'text-primary' : 'text-text',
                    )}
                  >
                    가나다
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap text-[11px]',
                      designFont === id
                        ? 'font-semibold text-primary'
                        : 'text-text-muted',
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 일정 — 상세(Hero schedule)와 동일하게 소개 위에 배치 */}
        <EditableRow
          icon="calendar"
          text={timeText && dateText ? `${dateText} ${formatTimeKorean(timeText)}` : (dateText || '')}
          placeholder="날짜·시간을 정해주세요"
          error={dateError}
          onClick={onEditDate}
          isDarkBg={bgClass.includes('aurora') || bgClass.includes('starry')}
        />

        {/* 소개 — 투명 textarea (상세: 일정 다음, 장소 앞) */}
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="모임 소개를 적어주세요"
          rows={3}
          maxLength={2000}
          className={cn(
            "border-border/50 bg-[#dadada2b] backdrop-blur",
            bgClass.includes('aurora') || bgClass.includes('starry')
              ? 'text-white placeholder:text-white/70'
              : ''
          )}
        />

        {/* 장소 — 상세(InformationsContainer)와 동일하게 소개 아래 배치 */}
        <EditableRow
          icon="map-pin"
          text={placeText}
          placeholder={locationUnknown ? "장소를 입력하세요" : "장소 미정"}
          error={locationError}
          onClick={onEditLocation}
          isDarkBg={bgClass.includes('aurora') || bgClass.includes('starry')}
        />

        {/* 모임 옵션 — 회비·드레스코드·주차 (선택) */}
        <EditableRow
          icon="clipboard-list"
          text={optionsText}
          placeholder="모임 옵션 추가하기 (선택)"
          onClick={onEditOptions}
          isDarkBg={bgClass.includes('aurora') || bgClass.includes('starry')}
        />

        {/* RSVP (탭하면 편집) */}
        <button
          type="button"
          onClick={onEditRsvp}
          className="mt-auto block w-full"
        >
          <div className="grid grid-cols-3 gap-2 pt-2">
            {(['attending', 'maybe', 'declined'] as RsvpType[]).map((type) => (
              <div
                key={type}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-md border border-border/50 bg-[#dadada2b] px-3 py-3 backdrop-blur hover:bg-surface transition-colors',
                  bgClass.includes('aurora') || bgClass.includes('starry')
                    ? 'text-white'
                    : 'text-text-muted',
                )}
              >
                <span className="text-[26px] leading-none">
                  {rsvp[type].emoji}
                </span>
                <span className="text-[13px]">
                  {rsvp[type].label}
                </span>
              </div>
            ))}
          </div>
        </button>

        {/* 편집 버튼 (RSVP, 배경색, 애니메이션) */}
        <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
          <button
            type="button"
            onClick={onEditRsvp}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-md bg-[#dadada2b] px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[#dadada4d] backdrop-blur",
              bgClass.includes('aurora') || bgClass.includes('starry')
                ? 'text-white'
                : 'text-text'
            )}
          >
            <Icon name="smile" size="sm" color="currentColor" decorative />
            참석
          </button>
          <button
            type="button"
            onClick={onEditBgColor}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-md bg-[#dadada2b] px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[#dadada4d] backdrop-blur",
              bgClass.includes('aurora') || bgClass.includes('starry')
                ? 'text-white'
                : 'text-text'
            )}
          >
            <Icon name="palette" size="sm" color="currentColor" decorative />
            배경
          </button>
          <button
            type="button"
            onClick={onEditAnimation}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-md bg-[#dadada2b] px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[#dadada4d] backdrop-blur",
              bgClass.includes('aurora') || bgClass.includes('starry')
                ? 'text-white'
                : 'text-text'
            )}
          >
            <Icon name="sparkles" size="sm" color="currentColor" decorative />
            효과
          </button>
        </div>
      </main>
      </div>
    </div>
  );
}
