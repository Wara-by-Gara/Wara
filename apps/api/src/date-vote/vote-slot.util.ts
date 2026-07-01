export interface SlotKeyInput {
  date?: string | null;
  startTime?: string | null;
  label?: string | null;
}

/** date+startTime(날짜 투표) 또는 label(커스텀 투표) 조합으로 슬롯 중복 여부 판별 */
export function voteSlotKey(dateOrInput: string | null | SlotKeyInput, startTime?: string | null): string {
  if (typeof dateOrInput === 'object' && dateOrInput !== null) {
    const { date, startTime: st, label } = dateOrInput;
    if (label != null && label !== '') return `custom|${label}`;
    return `date|${date ?? ''}|${st ?? ''}`;
  }
  // 하위호환: (date, startTime) 시그니처
  return `date|${dateOrInput ?? ''}|${startTime ?? ''}`;
}

export function findDuplicateVoteSlotKey(slots: SlotKeyInput[]): string | null {
  const seen = new Set<string>();
  for (const slot of slots) {
    const key = voteSlotKey(slot);
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return null;
}
