import { ListPublicMapInvitationsSchema } from './list-public-map-invitations.dto';

describe('ListPublicMapInvitationsSchema', () => {
  const validBbox = {
    neLat: '37.6',
    neLng: '127.1',
    swLat: '37.4',
    swLng: '126.9',
  };

  it('정상 bbox + 기본값(limit=200) 통과', () => {
    const r = ListPublicMapInvitationsSchema.safeParse(validBbox);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.limit).toBe(200);
      expect(r.data.neLat).toBe(37.6);
    }
  });

  it('category optional — 없어도 통과', () => {
    const r = ListPublicMapInvitationsSchema.safeParse(validBbox);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.category).toBeUndefined();
  });

  it('category enum — 잘못된 값 거부', () => {
    const r = ListPublicMapInvitationsSchema.safeParse({
      ...validBbox,
      category: 'invalid',
    });
    expect(r.success).toBe(false);
  });

  it('좌표 범위 초과(neLat>90) 거부', () => {
    const r = ListPublicMapInvitationsSchema.safeParse({
      ...validBbox,
      neLat: '95',
    });
    expect(r.success).toBe(false);
  });

  it('sw > ne 거부 (neLat<swLat)', () => {
    const r = ListPublicMapInvitationsSchema.safeParse({
      ...validBbox,
      neLat: '37.0',
      swLat: '37.5',
    });
    expect(r.success).toBe(false);
  });

  it('bbox 면적 > 5° 거부 (위도 span)', () => {
    const r = ListPublicMapInvitationsSchema.safeParse({
      ...validBbox,
      neLat: '40.0',
      swLat: '34.0',
    });
    expect(r.success).toBe(false);
  });

  it('bbox 면적 > 5° 거부 (경도 span)', () => {
    const r = ListPublicMapInvitationsSchema.safeParse({
      ...validBbox,
      neLng: '130.0',
      swLng: '124.0',
    });
    expect(r.success).toBe(false);
  });

  it('정확히 5° span은 통과 (경계값)', () => {
    const r = ListPublicMapInvitationsSchema.safeParse({
      neLat: '40.0',
      neLng: '130.0',
      swLat: '35.0',
      swLng: '125.0',
    });
    expect(r.success).toBe(true);
  });

  it('limit clamp — 500 초과 거부', () => {
    const r = ListPublicMapInvitationsSchema.safeParse({
      ...validBbox,
      limit: '501',
    });
    expect(r.success).toBe(false);
  });

  it('limit clamp — 0 거부', () => {
    const r = ListPublicMapInvitationsSchema.safeParse({
      ...validBbox,
      limit: '0',
    });
    expect(r.success).toBe(false);
  });
});
