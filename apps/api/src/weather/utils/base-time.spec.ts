import { getBaseDateTime, getForecastTime, getForecastDate } from './base-time';

// KST = UTC + 9h
function kst(year: number, month: number, day: number, hour: number, min = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 9, min));
}

describe('getBaseDateTime', () => {
  it('KST 02:10 → baseTime 0200', () => {
    const { baseTime } = getBaseDateTime(kst(2025, 6, 15, 2, 10));
    expect(baseTime).toBe('0200');
  });

  it('KST 02:09 (발표 10분 미달) → 전날 2300', () => {
    const { baseDate, baseTime } = getBaseDateTime(kst(2025, 6, 15, 2, 9));
    expect(baseTime).toBe('2300');
    expect(baseDate).toBe('20250614');
  });

  it('KST 00:00 → 전날 2300', () => {
    const { baseTime, baseDate } = getBaseDateTime(kst(2025, 6, 15, 0, 0));
    expect(baseTime).toBe('2300');
    expect(baseDate).toBe('20250614');
  });

  it('KST 05:10 → baseTime 0500', () => {
    const { baseTime, baseDate } = getBaseDateTime(kst(2025, 6, 15, 5, 10));
    expect(baseTime).toBe('0500');
    expect(baseDate).toBe('20250615');
  });

  it('KST 14:09 (1400 발표 10분 미달) → 1100', () => {
    const { baseTime } = getBaseDateTime(kst(2025, 6, 15, 14, 9));
    expect(baseTime).toBe('1100');
  });

  it('KST 23:59 → baseTime 2300', () => {
    const { baseTime, baseDate } = getBaseDateTime(kst(2025, 6, 15, 23, 59));
    expect(baseTime).toBe('2300');
    expect(baseDate).toBe('20250615');
  });
});

describe('getForecastTime', () => {
  it('KST 14:30 이벤트 → fcstTime 1400', () => {
    expect(getForecastTime(kst(2025, 6, 15, 14, 30))).toBe('1400');
  });

  it('KST 00:00 이벤트 → fcstTime 0000', () => {
    expect(getForecastTime(kst(2025, 6, 15, 0, 0))).toBe('0000');
  });

  it('KST 23:00 이벤트 → fcstTime 2300', () => {
    expect(getForecastTime(kst(2025, 6, 15, 23, 0))).toBe('2300');
  });
});

describe('getForecastDate', () => {
  it('KST 2025-06-15 → 20250615', () => {
    expect(getForecastDate(kst(2025, 6, 15, 12, 0))).toBe('20250615');
  });

  it('UTC 15:00 (KST 익일 00:00) → KST 날짜', () => {
    // UTC 2025-06-15T15:00Z = KST 2025-06-16T00:00
    expect(getForecastDate(new Date('2025-06-15T15:00:00Z'))).toBe('20250616');
  });
});
