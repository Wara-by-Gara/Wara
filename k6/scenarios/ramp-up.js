/**
 * Ramp-up 테스트 — 단계별 부하 증가
 *
 * 목적: 트래픽이 점진적으로 늘어날 때 API의 처리 한계와 병목 지점을 파악한다.
 *
 * 단계:
 *   0 → 10 VU  (2분): 웜업
 *   10 → 50 VU (5분): 정상 트래픽 범위
 *   50 → 100 VU(5분): 높은 트래픽
 *   100 → 300 VU(5분): 피크 트래픽
 *   300 → 0 VU (3분): 쿨다운
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=http://localhost:3001 \
 *     -e INVITATION_ID=01JVXXXXXXXXXXXXXXXXXXXXXXXXX \
 *     -e ACCESS_TOKEN=your_jwt_token \
 *     k6/scenarios/ramp-up.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { getAccessToken, authHeaders } from '../helpers/auth.js';
import { defaultThresholds } from '../thresholds.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const INVITATION_ID = __ENV.INVITATION_ID || '01JVXXXXXXXXXXXXXXXXXXXXXXXXX';

const readDuration = new Trend('rampup_read_duration', true);
const errorRate = new Rate('rampup_errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '5m', target: 300 },
    { duration: '3m', target: 0 },
  ],
  thresholds: {
    ...defaultThresholds,
    rampup_errors: ['rate<0.01'],
  },
};

export default function () {
  const token = getAccessToken();

  group('초대장 조회 (Public)', () => {
    const res = http.get(`${BASE_URL}/api/v1/invitations/${INVITATION_ID}`);
    const ok = check(res, { 'rampup: invitation 200|404': (r) => r.status === 200 || r.status === 404 });
    readDuration.add(res.timings.duration);
    errorRate.add(!ok);
  });

  group('참가자 목록 조회 (인증)', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/invitations/${INVITATION_ID}/participants`,
      { headers: authHeaders(token) },
    );
    check(res, { 'rampup: participants 200|401': (r) => r.status === 200 || r.status === 401 });
  });

  sleep(1);
}
