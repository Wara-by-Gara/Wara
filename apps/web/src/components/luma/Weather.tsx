import { cn } from "@/lib/cn";

const CONDITIONS = [
  { en: "Clear", ko: "맑음", icon: "☀️" },
  { en: "Cloudy", ko: "흐림", icon: "☁️" },
  { en: "Rain", ko: "비", icon: "🌧️" },
  { en: "Thunderstorms", ko: "뇌우", icon: "⛈️" },
  { en: "Snow", ko: "눈", icon: "❄️" },
  { en: "Foggy", ko: "안개", icon: "🌫️" },
  { en: "Windy", ko: "바람", icon: "💨" },
  { en: "Hot", ko: "더움", icon: "🌡️" },
] as const;

export function LumaWeatherCard({
  condition,
  ko,
  icon,
}: {
  condition: string;
  ko: string;
  icon: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-sm border border-gray-800 bg-gray-800/50 p-6 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm font-medium text-text-primary">{condition}</p>
      <p className="text-xs text-text-tertiary">{ko}</p>
    </div>
  );
}

export function LumaWeatherGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-4", className)}>
      {CONDITIONS.map((c) => (
        <LumaWeatherCard key={c.en} condition={c.en} ko={c.ko} icon={c.icon} />
      ))}
    </div>
  );
}
