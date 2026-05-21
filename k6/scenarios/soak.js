/**
 * Soak 테스트 — 장시간 안정성 검증
 *
 * 목적: 중간 수준의 부하를 장시간 유지하면서 메모리 누수, 커넥션 풀 고갈,
 *       점진적 응답 지연 등 시간이 지나면서 나타나는 문제를 감지한다.
 *
 * 단계:
 *   0 → 50 VU (2분) : 웜업
 *   50 VU     (30분): 안정적 중간 부하 유지
 *   50 → 0 VU (2분) : 쿨다운
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=http://localhost:3001 \
 *     -e INVITATION_ID=01JVXXXXXXXXXXXXXXXXXXXXXXXXX \
 *     -e ACCESS_TOKEN=your_jwt_token \
 *     k6/scenarios/soak.js
 *
 * 주의: 전체 실행 시간 약 34분. 프로덕션 배포 전 1회 실행 권장.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { getAccessToken, authHeaders } from '../helpers/auth.js';
import { defaultThresholds } from '../thresholds.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const INVITATION_ID = __ENV.INVITATION_ID || '01JVXXXXXXXXXXXXXXXXXXXXXXXXX';

const responseTrend = new Trend('soak_response_duration', true);
const errorRate = new Rate('soak_errors');

export const options = {
  stages: [
    { duration: '2m',  target: 50 },
    { duration: '30m', target: 50 },
    { duration: '2m',  target: 0 },
  ],
  thresholds: {
    ...defaultThresholds,
    soak_errors: ['rate<0.01'],
    // 30분 후에도 응답 시간이 초기 대비 30% 이상 증가하지 않아야 한다 (간접 지표)
    soak_response_duration: ['p(95)<650'],
  },
};

export default function () {
  const token = getAccessToken();

  group('초대장 조회', () => {
    const res = http.get(`${BASE_URL}/api/v1/invitations/${INVITATION_ID}`);
    const ok = check(res, { 'soak: invitation 200|404': (r) => r.status === 200 || r.status === 404 });
    responseTrend.add(res.timings.duration);
    errorRate.add(!ok);
  });

  group('참가자 목록 조회', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/invitations/${INVITATION_ID}/participants`,
      { headers: authHeaders(token) },
    );
    check(res, { 'soak: participants 200|401': (r) => r.status === 200 || r.status === 401 });
    responseTrend.add(res.timings.duration);
  });

  sleep(2);
}
