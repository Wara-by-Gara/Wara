import { latLngToGrid } from './grid-converter';

describe('latLngToGrid', () => {
  it('서울 시청 → KMA 격자 (60, 127)', () => {
    const result = latLngToGrid(37.5665, 126.978);
    expect(result.nx).toBe(60);
    expect(result.ny).toBe(127);
  });

  it('부산 중구 → KMA 격자 (98, 76)', () => {
    const result = latLngToGrid(35.1796, 129.0756);
    expect(result.nx).toBe(98);
    expect(result.ny).toBe(76);
  });

  it('제주 → KMA 격자 (53, 38)', () => {
    const result = latLngToGrid(33.4996, 126.5312);
    expect(result.nx).toBe(53);
    expect(result.ny).toBe(38);
  });

  it('결과는 항상 정수', () => {
    const { nx, ny } = latLngToGrid(37.1234, 127.5678);
    expect(Number.isInteger(nx)).toBe(true);
    expect(Number.isInteger(ny)).toBe(true);
  });

  it('동일 좌표 → 동일 격자 (결정론적)', () => {
    const a = latLngToGrid(37.5665, 126.978);
    const b = latLngToGrid(37.5665, 126.978);
    expect(a).toEqual(b);
  });
});
