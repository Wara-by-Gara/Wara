"use client";

export type WeatherCondition =
  | "sunny"
  | "partlyCloudy"
  | "cloudy"
  | "overcast"
  | "rainy"
  | "rainOrSnow"
  | "shower"
  | "snowy"
  | "thunder"
  | "foggy";

export interface WeatherCardProps {
  condition?: WeatherCondition;
  temperatureCelsius?: number;
  rainProbability?: number;
  tip?: string;
  /** 날씨 정보를 표시할지 여부 (호스트가 OFF 시 숨김) */
  enabled?: boolean;
  /** 모임 날짜가 3일 이상 남아 예보 미제공 상태 */
  unavailable?: boolean;
}

export const WEATHER_META: Record<
  WeatherCondition,
  { emoji: string; label: string }
> = {
  sunny:        { emoji: "☀️",  label: "맑음" },
  partlyCloudy: { emoji: "⛅",  label: "구름 조금" },
  cloudy:       { emoji: "🌥️", label: "구름 많음" },
  overcast:     { emoji: "☁️",  label: "흐림" },
  rainy:        { emoji: "🌧️", label: "비" },
  rainOrSnow:   { emoji: "🌨️", label: "비 / 눈" },
  shower:       { emoji: "🌦️", label: "소나기" },
  snowy:        { emoji: "❄️",  label: "눈" },
  thunder:      { emoji: "⛈️",  label: "천둥 / 번개" },
  foggy:        { emoji: "🌫️", label: "안개" },
};

export function LocationWeatherInline({
  condition,
  temperatureCelsius,
}: {
  condition?: WeatherCondition;
  temperatureCelsius?: number;
}) {
  if (condition === undefined || temperatureCelsius === undefined) return null;
  const meta = WEATHER_META[condition];
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
      <span className="text-[20px] leading-none" aria-hidden>
        {meta.emoji}
      </span>
      <span className="text-[13px] font-medium text-text-secondary">
        {temperatureCelsius}°C
      </span>
    </div>
  );
}

export function WeatherCard({
  condition,
  temperatureCelsius,
  rainProbability,
  tip,
  enabled = true,
  unavailable = false,
}: WeatherCardProps) {
  if (!enabled) return null;

  const meta = condition ? WEATHER_META[condition] : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[18px]">🌤️</span>
        <span className="text-[14px] font-bold text-text-primary">모임 날씨</span>
        <span className="mx-1 text-text-tertiary">|</span>
        <span className="text-[12px] text-text-tertiary">모임 시간 기준</span>
      </div>

      {unavailable ? (
        /* 3일 이전 — 예보 미제공 */
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-[14px] font-medium text-text-secondary leading-relaxed">
            날씨 정보는 모임 날짜 3일 전부터<br />확인하실 수 있어요.
          </p>
          <p className="text-[13px] text-text-tertiary">조금만 기다려주세요!</p>
        </div>
      ) : meta ? (
        /* 날씨 정보 표시 */
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-[16px] font-semibold text-text-primary">{meta.label}</p>
            <p className="text-[32px] font-extrabold leading-none text-primary">
              {temperatureCelsius}°C
            </p>
            {rainProbability !== undefined && (
              <p className="flex items-center gap-1 text-[13px] text-text-secondary">
                <span>🌂</span>
                <span>비 올 확률 {rainProbability}%</span>
              </p>
            )}
          </div>
          <span className="text-[64px] leading-none select-none">{meta.emoji}</span>
        </div>
      ) : null}

      {!unavailable && tip && (
        <>
          <div className="h-px bg-border" />
          <p className="text-[13px] text-text-secondary">{tip}</p>
        </>
      )}
    </div>
  );
}
