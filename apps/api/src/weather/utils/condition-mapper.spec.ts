import { toCondition, toMessage } from './condition-mapper';

describe('toCondition', () => {
  it('PTY 1(비) → 비', () => {
    expect(toCondition('1', '1')).toBe('비');
  });

  it('PTY 2(비/눈) → 비/눈', () => {
    expect(toCondition('1', '2')).toBe('비/눈');
  });

  it('PTY 3(눈) → 눈', () => {
    expect(toCondition('4', '3')).toBe('눈');
  });

  it('PTY 4(소나기) → 소나기', () => {
    expect(toCondition('1', '4')).toBe('소나기');
  });

  it('PTY 0 + SKY 1(맑음) → 맑음', () => {
    expect(toCondition('1', '0')).toBe('맑음');
  });

  it('PTY 0 + SKY 3(구름많음) → 구름 조금', () => {
    expect(toCondition('3', '0')).toBe('구름 조금');
  });

  it('PTY 0 + SKY 4(흐림) → 흐림', () => {
    expect(toCondition('4', '0')).toBe('흐림');
  });

  it('PTY 우선 — PTY 있으면 SKY 무시', () => {
    expect(toCondition('1', '3')).toBe('눈');
  });

  it('알 수 없는 SKY 값 → 흐림 fallback', () => {
    expect(toCondition('9', '0')).toBe('흐림');
  });
});

describe('toMessage', () => {
  it('맑음 → 가볍게 입고 와도 좋아요', () => {
    expect(toMessage('맑음')).toBe('가볍게 입고 와도 좋아요');
  });

  it('비 → 우산 꼭 챙기세요', () => {
    expect(toMessage('비')).toBe('우산 꼭 챙기세요');
  });

  it('눈 → 미끄러우니 조심해서 오세요', () => {
    expect(toMessage('눈')).toBe('미끄러우니 조심해서 오세요');
  });
});
