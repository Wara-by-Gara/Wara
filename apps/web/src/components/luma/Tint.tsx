import { cn } from "@/lib/cn";
import { LumaButton } from "./Button";

const TINT_STEPS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function tintColor(base: string, step: number): string {
  const opacity = step / 100;
  return `color-mix(in srgb, ${base} ${Math.round(opacity * 100)}%, transparent)`;
}

export function LumaTintPreview({ brandColor = "#f31a7c" }: { brandColor?: string }) {
  return (
    <div className="space-y-4">
      <div className="h-2 w-full rounded-full" style={{ backgroundColor: brandColor }} />
      <div className="grid grid-cols-2 gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={cn(
              "space-y-3 rounded-lg p-6",
              mode === "light" ? "bg-white text-gray-900" : "bg-gray-900 text-white",
            )}
          >
            <p className="text-sm font-semibold">{mode === "light" ? "라이트 모드" : "다크 모드"}</p>
            <p className="text-base font-medium">기본 텍스트</p>
            <p className={cn("text-sm", mode === "light" ? "text-gray-600" : "text-gray-400")}>보조 텍스트</p>
            <p className={cn("text-xs", mode === "light" ? "text-gray-400" : "text-gray-500")}>부가 텍스트</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <LumaButton color="brand">브랜드</LumaButton>
              <LumaButton color="primary">기본</LumaButton>
              <LumaButton color="secondary">보조</LumaButton>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {TINT_STEPS.map((step) => (
          <div key={step} className="flex flex-col items-center gap-1">
            <div className="size-4 rounded-sm" style={{ backgroundColor: tintColor(brandColor, step) }} />
            <span className="text-[10px] text-text-tertiary">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
