const BASE_TIMES = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];

function toKst(date: Date): Date {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  return `${yyyy}${mm}${dd}`;
}

export function getBaseDateTime(now: Date): { baseDate: string; baseTime: string } {
  const kst = toKst(now);
  const kstHour = kst.getUTCHours();
  const kstMin = kst.getUTCMinutes();
  const kstTotalMin = kstHour * 60 + kstMin;

  const baseTotalMins = BASE_TIMES.map((t) => {
    const h = parseInt(t.slice(0, 2), 10);
    const m = parseInt(t.slice(2), 10);
    return h * 60 + m;
  });

  // 현재 KST 시각 기준 가장 최근 발표 시각 (발표 후 10분 이내면 이전 시각)
  let selectedIdx = -1;
  for (let i = baseTotalMins.length - 1; i >= 0; i--) {
    const baseMin = baseTotalMins[i];
    if (baseMin !== undefined && kstTotalMin >= baseMin + 10) {
      selectedIdx = i;
      break;
    }
  }

  // KST 0210 이전 → 전날 2300 사용
  if (selectedIdx === -1) {
    return {
      baseDate: formatDate(new Date(kst.getTime() - 24 * 60 * 60 * 1000)),
      baseTime: '2300',
    };
  }

  return {
    baseDate: formatDate(kst),
    baseTime: BASE_TIMES[selectedIdx] ?? '2300',
  };
}

export function getForecastTime(eventStartAt: Date): string {
  const kstHour = (eventStartAt.getUTCHours() + 9) % 24;
  return pad2(kstHour) + '00';
}

export function getForecastDate(eventStartAt: Date): string {
  return formatDate(toKst(eventStartAt));
}
