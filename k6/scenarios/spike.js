/**
 * Spike 테스트 — 순간 폭증 부하
 *
 * 목적: 이벤트 링크가 SNS에서 갑자기 퍼질 때와 같이 트래픽이 순간 급증하는 상황에서
 *       API가 오류 없이 처리하거나 graceful하게 실패하는지 검증한다.
 *
 * 단계:
 *   0 → 300 VU (30초): 급격한 폭증
 *   300 VU    (1분) : 최대 부하 유지
 *   300 → 0 VU(30초): 급격한 감소
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=http://localhost:3001 \
 *     -e INVITATION_ID=01JVXXXXXXXXXXXXXXXXXXXXXXXXX \
 *     k6/scenarios/spike.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { defaultThresholds } from '../thresholds.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const INVITATION_ID = __ENV.INVITATION_ID || '01JVXXXXXXXXXXXXXXXXXXXXXXXXX';

const errorRate = new Rate('spike_errors');

export const options = {
  stages: [
    { duration: '30s', target: 300 },
    { duration: '1m',  target: 300 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // 스파이크 중에는 p(99) 기준을 완화 (2s)
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    spike_errors: ['rate<0.05'],
  },
};

export default function () {
  // 스파이크 시 가장 빈번한 요청 패턴: Public 초대장 조회
  const res = http.get(`${BASE_URL}/api/v1/invitations/${INVITATION_ID}`);
  const ok = check(res, {
    'spike: status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'spike: not 5xx': (r) => r.status < 500,
  });
  errorRate.add(!ok);

  sleep(0.5);
}
