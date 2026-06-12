/** date + startTime 조합으로 슬롯 중복 여부 판별 */
export function voteSlotKey(date: string, startTime?: string | null): string {
  return `${date}|${startTime ?? ''}`;
}

export function findDuplicateVoteSlotKey(
  slots: { date: string; startTime?: string | null }[],
): string | null {
  const seen = new Set<string>();
  for (const slot of slots) {
    const key = voteSlotKey(slot.date, slot.startTime);
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return null;
}
