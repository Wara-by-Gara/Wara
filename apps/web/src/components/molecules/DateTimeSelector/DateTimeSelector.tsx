'use client';

import {
  forwardRef,
  useState,
  useId,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Switch } from '@/components/primitives/Switch';
import { cn } from '@/lib/cn';

export interface DateTimeSelectorProps {
  mode: 'date' | 'time' | 'date-range' | 'time-range';
  label?: string;
  value?: string;
  endValue?: string;
  onChange?: (value: string) => void;
  onEndChange?: (value: string) => void;
  unknownToggle?: boolean;
  unknown?: boolean;
  onUnknownChange?: (unknown: boolean) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const inputClass =
  'h-12 w-full rounded-xs border border-border-strong bg-surface px-4 text-[15px] text-text-primary outline-none focus:border-primary';

// ── 24h HH:MM ↔ 오전/오후 + 1-12h 변환 ───────────────────────────────────────
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45];

function parseHHMM(hhmm: string): {
  ampm: '오전' | '오후';
  hour: number;
  minute: number;
} {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const ampm: '오전' | '오후' = h < 12 ? '오전' : '오후';
  let hour = h % 12;
  if (hour === 0) hour = 12;
  const minute = MINUTES.includes(m) ? m : 0;
  return { ampm, hour, minute };
}

function toHHMM(ampm: '오전' | '오후', hour: number, minute: number): string {
  let h = hour;
  if (ampm === '오후' && hour !== 12) h = hour + 12;
  if (ampm === '오전' && hour === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ── WheelColumn ───────────────────────────────────────────────────────────────
const ITEM_H = 44;
const VISIBLE = 5;

function WheelColumn<T extends number>({
  items,
  value,
  onChange,
  format,
  disabled,
}: {
  items: T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIdx = items.indexOf(value);

  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    if (!ref.current) return;
    ref.current.scrollTo({
      top: idx * ITEM_H,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  useEffect(() => {
    if (!isScrolling.current) scrollToIndex(selectedIdx, false);
  }, [selectedIdx, scrollToIndex]);

  const handleScroll = () => {
    if (!ref.current || disabled) return;
    isScrolling.current = true;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      isScrolling.current = false;
      if (items[clamped] !== undefined && items[clamped] !== value)
        onChange(items[clamped]!);
      ref.current.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
    }, 120);
  };

  return (
    <div
      className="relative flex flex-1 flex-col items-center"
      style={{ height: ITEM_H * VISIBLE }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 rounded-sm bg-primary/10"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-white/90 to-transparent"
        style={{ height: ITEM_H * 2 }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white/90 to-transparent"
        style={{ height: ITEM_H * 2 }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="w-full overflow-y-scroll overscroll-contain"
        style={{
          height: ITEM_H * VISIBLE,
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIdx);
          return (
            <div
              key={item}
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
              className="flex cursor-pointer items-center justify-center"
              onClick={() => {
                if (!disabled) {
                  onChange(item);
                  scrollToIndex(i);
                }
              }}
            >
              <span
                className={cn(
                  'tabular-nums transition-all duration-150',
                  dist === 0
                    ? 'text-[20px] font-extrabold text-primary'
                    : dist === 1
                      ? 'text-[16px] font-semibold text-text-secondary opacity-60'
                      : 'text-[14px] font-medium text-text-tertiary opacity-30',
                )}
              >
                {format ? format(item) : String(item).padStart(2, '0')}
              </span>
            </div>
          );
        })}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

// ── TimeWheelPicker ───────────────────────────────────────────────────────────
function TimeWheelPicker({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
}) {
  const parsed = value
    ? parseHHMM(value)
    : { ampm: '오후' as const, hour: 2, minute: 0 };
  const [ampm, setAmpm] = useState<'오전' | '오후'>(parsed.ampm);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);

  const emit = useCallback(
    (a: '오전' | '오후', h: number, m: number) => {
      onChange?.(toHHMM(a, h, m));
    },
    [onChange],
  );

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2 rounded-md border border-border bg-surface p-3',
        disabled && 'opacity-40 pointer-events-none',
      )}
    >
      {/* 오전/오후 토글 */}
      <div className="flex overflow-hidden rounded-sm border border-border bg-background-soft">
        {(['오전', '오후'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setAmpm(v);
              emit(v, hour, minute);
            }}
            className={cn(
              'flex flex-1 items-center justify-center py-1.5 text-[13px] font-extrabold transition-all duration-150',
              ampm === v ? 'bg-primary text-white' : 'text-text-tertiary',
            )}
          >
            {v}
            <span className="ml-1 text-[11px] font-normal opacity-60">
              {v === '오전' ? 'am' : 'pm'}
            </span>
          </button>
        ))}
      </div>

      {/* 시·분 휠 */}
      <div className="flex items-center gap-0 overflow-hidden rounded-sm border border-border bg-white px-2 h-[150px]">
        <WheelColumn
          items={HOURS}
          value={hour}
          onChange={(h) => {
            setHour(h);
            emit(ampm, h, minute);
          }}
          format={(v) => String(v)}
          disabled={disabled}
        />
        <div className="text-[20px] font-extrabold text-text-tertiary">:</div>
        <WheelColumn
          items={MINUTES}
          value={minute}
          onChange={(m) => {
            setMinute(m);
            emit(ampm, hour, m);
          }}
          format={(v) => String(v).padStart(2, '0')}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ── DateTimeSelector ──────────────────────────────────────────────────────────
export const DateTimeSelector = forwardRef<
  HTMLDivElement,
  DateTimeSelectorProps
>(function DateTimeSelector(
  {
    mode,
    label,
    value,
    onChange,
    unknownToggle,
    unknown,
    onUnknownChange,
    error,
    disabled,
    className,
  },
  ref,
) {
  const id = useId();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [internalUnknown, setInternalUnknown] = useState(unknown ?? false);
  const isUnknown = unknownToggle ? (unknown ?? internalUnknown) : false;

  useEffect(() => {
    setInternalUnknown(unknown ?? false);
  }, [unknown]);

  const inputType = mode.startsWith('date') ? 'date' : 'time';

  return (
    <div ref={ref} className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="text-[14px] font-medium text-text-primary"
          >
            {label}
          </label>
          {unknownToggle ? (
            <Switch
              checked={isUnknown}
              onCheckedChange={(checked) => {
                setInternalUnknown(checked);
                onUnknownChange?.(checked);
              }}
              disabled={disabled}
            />
          ) : null}
        </div>
      ) : null}

      <div className={cn(!isUnknown && 'opacity-40 pointer-events-none')}>
        {inputType === 'time' ? (
          <div className={cn('flex items-start gap-2')}>
            <TimeWheelPicker
              value={value}
              onChange={onChange}
              disabled={disabled || !isUnknown}
            />
          </div>
        ) : (
          <div className={cn('flex items-center gap-2')}>
            <input
              ref={dateInputRef}
              id={id}
              type="date"
              value={value ?? ''}
              onChange={(e) => onChange?.(e.target.value)}
              onClick={() => dateInputRef.current?.showPicker?.()}
              disabled={disabled || !isUnknown}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {error ? <span className="text-[13px] text-danger">{error}</span> : null}
    </div>
  );
});
