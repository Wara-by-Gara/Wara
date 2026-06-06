const WEEKDAY_SHORT = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 초대장 일시 — 예: 6월 3일(수), 오후 7시 30분 */
export function formatInvitationEventDate(
  eventStartAt: string | null | undefined,
  emptyLabel = "미정",
): string {
  if (!eventStartAt) return emptyLabel;

  const d = new Date(eventStartAt);
  if (Number.isNaN(d.getTime())) return emptyLabel;

  const datePart = `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEKDAY_SHORT[d.getDay()]})`;

  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 || 12;
  const timePart = m === 0 ? `${ampm} ${h12}시` : `${ampm} ${h12}시 ${m}분`;

  return `${datePart}, ${timePart}`;
}

/** 가로 카드용 일시 (미정 시 빈 문자열) */
export function formatInvitationCardDate(
  eventStartAt: string | null | undefined,
): string {
  return formatInvitationEventDate(eventStartAt, "");
}
