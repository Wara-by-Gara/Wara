/** 초대장 카드·목록용 일시 — 예: 5월 31일 (일) 오후 08:00 */
export function formatInvitationEventDate(eventStartAt: string | null | undefined): string {
  if (!eventStartAt) return "미정";

  const d = new Date(eventStartAt);
  if (Number.isNaN(d.getTime())) return "미정";

  const monthDay = d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
  const weekday = d
    .toLocaleDateString("ko-KR", { weekday: "short" })
    .replace(/\.$/, "");
  const hours24 = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours24 < 12 ? "오전" : "오후";
  const hours12 = hours24 % 12 || 12;
  const time = `${ampm} ${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return `${monthDay} (${weekday}) ${time}`;
}
