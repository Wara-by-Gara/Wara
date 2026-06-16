import { cn } from "@/lib/cn";

interface InvitationOptionsProps {
  fee?: string | null;
  dressCode?: string | null;
  parkingInfo?: string | null;
  fontClass?: string;
  bgColor?: string;
}

/**
 * 모임 옵션(회비·드레스코드·주차) 읽기 전용 표시.
 * 입력된 항목이 하나도 없으면 렌더링하지 않음.
 * 스타일은 소개글(InvitationDescriptionBox)과 동일한 글래스 박스/폰트 색상.
 */
export function InvitationOptions({
  fee,
  dressCode,
  parkingInfo,
  fontClass,
  bgColor,
}: InvitationOptionsProps) {
  const isDarkBg = bgColor?.includes("aurora") || bgColor?.includes("starry");
  const rows = [
    { label: "회비", value: fee },
    { label: "드레스코드", value: dressCode },
    { label: "공지 사항", value: parkingInfo },
  ].filter((r) => r.value?.trim());

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-white/40 bg-white/20 px-4 py-3 shadow-xs backdrop-blur-md backdrop-saturate-150">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-3">
          <span
            className={cn(
              "shrink-0 text-[14px] font-semibold",
              isDarkBg ? "text-white/70" : "text-text-disabled",
            )}
          >
            {row.label}
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 whitespace-pre-line text-left text-[15px] leading-[1.6]",
              isDarkBg ? "text-white" : "text-text",
              fontClass,
            )}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
