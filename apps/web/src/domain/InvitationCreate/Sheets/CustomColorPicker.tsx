'use client';

import { cn } from '@/lib/cn';
import { IconButton } from '@wara/ui';
import { customGradientCls, getGradientVariant, gradientBaseCls } from '@/domain/InvitationCreate/constants';
import type { DesignBgColor } from '@/domain/InvitationCreate/constants';

export interface CustomColorPickerProps {
  hue: number;
  onHueChange: (hue: number, cls: DesignBgColor) => void;
  onBack: () => void;
}

const HUE_TRACK =
  'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';

/** 배경색 편집 시트의 "커스텀" 서브뷰 — hue 슬라이더 하나로 밝은/깊은 톤 그라데이션 자동 생성 */
export function CustomColorPicker({ hue, onHueChange, onBack }: CustomColorPickerProps) {
  const variant = getGradientVariant(customGradientCls(hue))!;

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="-ml-1 flex items-center gap-1">
        <IconButton icon="chevron-left" label="뒤로가기" size="sm" onClick={onBack} />
        <span className="text-sm font-medium text-text">커스텀 컬러</span>
      </div>

      <input
        type="range"
        min={0}
        max={360}
        value={hue}
        onChange={(e) => {
          const h = Number(e.target.value);
          onHueChange(h, customGradientCls(h));
        }}
        className={cn(
          'h-3 w-full cursor-pointer appearance-none rounded-full',
          '[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
          '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md',
          '[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md',
        )}
        style={{ backgroundImage: HUE_TRACK }}
        aria-label="색상(hue) 선택"
      />

      <div
        className={cn('aspect-video w-full rounded-lg', gradientBaseCls(variant.id))}
        style={{ ['--c1' as string]: variant.c1, ['--c2' as string]: variant.c2 } as React.CSSProperties}
      />
    </div>
  );
}
