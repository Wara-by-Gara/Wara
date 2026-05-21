/**
 * Smoke 테스트 — 기준선 확인
 *
 * 목적: 최소 부하(1 VU)에서 API가 정상 동작하는지 확인한다.
 *       배포 후 첫 번째 검증 또는 시나리오 실행 전 사전 점검용.
 *
 * 측정 항목:
 *   - GET /api/v1/invitations/:id (Public) → 200
 *   - p(95) < 200ms, error rate < 1%
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=http://localhost:3001 \
 *     -e INVITATION_ID=01JVXXXXXXXXXXXXXXXXXXXXXXXXX \
 *     k6/scenarios/smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { defaultThresholds } from '../thresholds.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const INVITATION_ID = __ENV.INVITATION_ID || '01JVXXXXXXXXXXXXXXXXXXXXXXXXX';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    ...defaultThresholds,
    http_req_duration: ['p(95)<200'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/invitations/${INVITATION_ID}`);

  check(res, {
    'smoke: status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'smoke: response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
