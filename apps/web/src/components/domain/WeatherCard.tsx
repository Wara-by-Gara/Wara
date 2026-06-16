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

export const WEATHER_META: Record<WeatherCondition, { emoji: string; label: string }> = {
  sunny: { emoji: "☀️", label: "맑음" },
  partlyCloudy: { emoji: "⛅", label: "구름 조금" },
  cloudy: { emoji: "🌥️", label: "구름 많음" },
  overcast: { emoji: "☁️", label: "흐림" },
  rainy: { emoji: "🌧️", label: "비" },
  rainOrSnow: { emoji: "🌨️", label: "비 / 눈" },
  shower: { emoji: "🌦️", label: "소나기" },
  snowy: { emoji: "❄️", label: "눈" },
  thunder: { emoji: "⛈️", label: "천둥 / 번개" },
  foggy: { emoji: "🌫️", label: "안개" },
};

/** 위치 카드 우측에 붙는 인라인 날씨 (이모지 + 기온) */
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
      <span className="type-bodySmall font-medium text-text-muted">{temperatureCelsius}°C</span>
    </div>
  );
}

export interface WeatherCardProps {
  condition?: WeatherCondition;
  temperatureCelsius?: number;
  rainProbability?: number;
  tip?: string;
  /** 모임 3일 이전 — 예보 미제공 */
  unavailable?: boolean;
  className?: string;
}

export function WeatherCard({
  condition,
  temperatureCelsius,
  rainProbability,
  tip,
  unavailable = false,
  className,
}: WeatherCardProps) {
  const meta = condition ? WEATHER_META[condition] : null;

  return (
    <div className={`flex flex-col gap-3 rounded-md border border-border bg-surface p-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <span className="type-bodySmall font-bold text-text">모임 날씨</span>
        <span className="type-caption text-text-muted">· 모임 시간 기준</span>
      </div>

      {unavailable || !meta || temperatureCelsius === undefined ? (
        <p className="py-3 text-center type-bodySmall leading-relaxed text-text-muted">
          날씨 정보는 모임 날짜 3일 전부터 확인할 수 있어요.
        </p>
      ) : (
        <div className="flex items-center gap-4">
          <span className="text-[44px] leading-none" aria-hidden>
            {meta.emoji}
          </span>
          <div className="flex flex-col">
            <span className="type-sectionTitle text-text">{temperatureCelsius}°C</span>
            <span className="type-bodySmall text-text-muted">
              {meta.label}
              {rainProbability !== undefined ? ` · 강수 ${rainProbability}%` : ""}
            </span>
          </div>
        </div>
      )}

      {tip && !unavailable ? (
        <p className="rounded-lg bg-surface-muted px-3 py-2 type-caption text-text-muted">
          {tip}
        </p>
      ) : null}
    </div>
  );
}
