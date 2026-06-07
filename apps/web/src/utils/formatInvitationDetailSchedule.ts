const WEEKDAY_SHORT = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 상세 페이지 헤더용 일시 — 예: 7월 27일 (월) 오후 3:00 */
export function formatInvitationDetailSchedule(
  eventStartAt: string | null | undefined,
): string {
  if (!eventStartAt) return "";

  const d = new Date(eventStartAt);
  if (Number.isNaN(d.getTime())) return "";

  const datePart = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_SHORT[d.getDay()]})`;

  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 || 12;
  const timePart =
    m === 0
      ? `${ampm} ${h12}:00`
      : `${ampm} ${h12}:${String(m).padStart(2, "0")}`;

  return `${datePart} ${timePart}`;
}
