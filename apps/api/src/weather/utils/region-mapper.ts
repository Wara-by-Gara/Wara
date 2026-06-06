// 기상청 중기예보 구역코드 매핑
// 중기예보(getMidLandFcst / getMidTa)는 격자(nx/ny)가 아닌 예보구역코드(regId) 기반이며,
// 육상예보 regId(광역)와 기온 regId(도시)의 코드 체계가 서로 다르다.
// lat/lng로 직접 산출이 불가하므로 시·도 대표 지점으로 최근접 매칭한다. (V1: 시·도 단위)

export interface MidRegion {
  landRegId: string; // 중기육상예보 구역코드
  taRegId: string; // 중기기온 구역코드
}

interface RegionPoint extends MidRegion {
  lat: number;
  lng: number;
}

// 17개 시·도 대표 지점 (도청/시청 소재지 좌표 기준)
const REGION_POINTS: RegionPoint[] = [
  { lat: 37.5665, lng: 126.978, landRegId: '11B00000', taRegId: '11B10101' }, // 서울
  { lat: 37.4563, lng: 126.7052, landRegId: '11B00000', taRegId: '11B20201' }, // 인천
  { lat: 37.2636, lng: 127.0286, landRegId: '11B00000', taRegId: '11B20601' }, // 경기(수원)
  { lat: 37.8813, lng: 127.7298, landRegId: '11D10000', taRegId: '11D10301' }, // 강원영서(춘천)
  { lat: 37.7519, lng: 128.8761, landRegId: '11D20000', taRegId: '11D20501' }, // 강원영동(강릉)
  { lat: 36.6357, lng: 127.4917, landRegId: '11C10000', taRegId: '11C10301' }, // 충북(청주)
  { lat: 36.3504, lng: 127.3845, landRegId: '11C20000', taRegId: '11C20401' }, // 대전
  { lat: 36.4801, lng: 127.289, landRegId: '11C20000', taRegId: '11C20401' }, // 세종
  { lat: 36.6588, lng: 126.6739, landRegId: '11C20000', taRegId: '11C20401' }, // 충남(홍성)
  { lat: 35.8203, lng: 127.1088, landRegId: '11F10000', taRegId: '11F10201' }, // 전북(전주)
  { lat: 35.1595, lng: 126.8526, landRegId: '11F20000', taRegId: '11F20501' }, // 광주
  { lat: 34.8161, lng: 126.463, landRegId: '11F20000', taRegId: '11F20801' }, // 전남(무안→목포)
  { lat: 35.8714, lng: 128.6014, landRegId: '11H10000', taRegId: '11H10701' }, // 대구
  { lat: 36.576, lng: 128.5056, landRegId: '11H10000', taRegId: '11H10501' }, // 경북(안동)
  { lat: 35.1796, lng: 129.0756, landRegId: '11H20000', taRegId: '11H20201' }, // 부산
  { lat: 35.5384, lng: 129.3114, landRegId: '11H20000', taRegId: '11H20101' }, // 울산
  { lat: 35.2383, lng: 128.6924, landRegId: '11H20000', taRegId: '11H20301' }, // 경남(창원)
  { lat: 33.4996, lng: 126.5312, landRegId: '11G00000', taRegId: '11G00201' }, // 제주
];

// 위경도 → 가장 가까운 시·도 대표 지점의 regId
// 단거리 비교이므로 제곱 유클리드 거리로 충분 (정확한 대권거리 불필요)
export function latLngToMidRegion(lat: number, lng: number): MidRegion {
  let nearest = REGION_POINTS[0]!;
  let minDist = Number.POSITIVE_INFINITY;

  for (const point of REGION_POINTS) {
    const dLat = lat - point.lat;
    const dLng = lng - point.lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  }

  return { landRegId: nearest.landRegId, taRegId: nearest.taRegId };
}
