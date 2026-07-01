import { effectiveTier, maskLocation } from './location-tier.util';

describe('location-tier', () => {
  describe('effectiveTier', () => {
    it('참가자 오버라이드가 있으면 우선', () => {
      expect(effectiveTier('hidden', 'full')).toBe('hidden');
    });
    it('참가자 값이 null이면 유저 기본값', () => {
      expect(effectiveTier(null, 'distance')).toBe('distance');
    });
  });

  describe('maskLocation', () => {
    const loc = { lat: 37.4979, lng: 127.0276, accuracy: 5 };

    it('full은 좌표 그대로', () => {
      expect(maskLocation(loc, 'full')).toEqual({ ...loc, tier: 'full' });
    });

    it('hidden은 null', () => {
      expect(maskLocation(loc, 'hidden')).toBeNull();
    });

    it('distance는 격자 스냅 + 정확도 확대', () => {
      const m = maskLocation(loc, 'distance')!;
      expect(m.tier).toBe('distance');
      expect(m.accuracy).toBe(1000);
      // 0.01° 격자로 스냅
      expect(m.lat).toBeCloseTo(37.5, 5);
      expect(m.lng).toBeCloseTo(127.03, 5);
      // 정확 좌표가 노출되지 않음
      expect(m.lat).not.toBe(loc.lat);
      expect(m.lng).not.toBe(loc.lng);
    });
  });
});
