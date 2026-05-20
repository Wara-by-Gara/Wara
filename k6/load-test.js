/**
 * WARA API 전체 부하 테스트
 *
 * 점진적 부하를 가하며 API 전체의 안정성을 검증한다.
 * 실제 서비스 트래픽 패턴을 모사:
 *   - 초대장 조회 (Public) — 가장 빈번한 요청
 *   - 참가자 목록 조회 (인증)
 *   - presigned URL 발급
 *   - RSVP 변경
 *   - 사진 목록 조회
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=http://localhost:3001 \
 *     -e INVITATION_ID=01XXXXXXXXXXXXXXXXXXXXXXXXX \
 *     -e ACCESS_TOKEN=your_jwt_token \
 *     k6/load-test.js
 *
 * 결과 저장 (Prometheus + Grafana 연동):
 *   k6 run --out experimental-prometheus-rw k6/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getTokenForVu, authHeaders } from './helpers/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const INVITATION_ID = __ENV.INVITATION_ID || '01JVXXXXXXXXXXXXXXXXXXXXXXXXX';

// 커스텀 메트릭
const readDuration = new Trend('load_read_duration', true);
const writeDuration = new Trend('load_write_duration', true);
const errorRate = new Rate('load_errors');
const totalRequests = new Counter('load_total_requests');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // 워밍업: 10 VU
    { duration: '1m',  target: 50 },   // 점진적 증가: 50 VU
    { duration: '2m',  target: 100 },  // 최대 부하: 100 VU
    { duration: '30s', target: 0 },    // 쿨다운
  ],
  thresholds: {
    // 전체 HTTP 요청의 95%가 500ms 이내
    http_req_duration: ['p(95)<500'],
    // 전체 에러율 1% 미만
    http_req_failed: ['rate<0.01'],
    // Read 요청 (조회): 300ms 이내
    load_read_duration: ['p(95)<300'],
    // Write 요청 (생성/수정): 500ms 이내
    load_write_duration: ['p(95)<500'],
    // 커스텀 에러율 1% 미만
    load_errors: ['rate<0.01'],
  },
};

export default function () {
  const token = getTokenForVu(__VU);
  const headers = authHeaders(token);
  const publicHeaders = { 'Content-Type': 'application/json' };

  // 트래픽 분포 — 실제 서비스 패턴 기반
  // 조회 70% : presigned-url 15% : RSVP 변경 10% : 사진 목록 5%
  const rand = Math.random();

  if (rand < 0.70) {
    // --- 초대장 상세 조회 (Public) ---
    group('invitation_read', () => {
      const res = http.get(
        `${BASE_URL}/invitations/${INVITATION_ID}`,
        { headers: publicHeaders, tags: { name: 'GET /invitations/:id' } },
      );

      readDuration.add(res.timings.duration);
      totalRequests.add(1);

      const ok = check(res, {
        'invitation detail: 200': (r) => r.status === 200,
      });
      errorRate.add(ok ? 0 : 1);

      sleep(0.5 + Math.random() * 1);
    });
  } else if (rand < 0.85) {
    // --- presigned URL 발급 ---
    group('presigned_url', () => {
      const contentTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const ext = contentType.split('/')[1].replace('jpeg', 'jpg');

      const res = http.post(
        `${BASE_URL}/invitations/${INVITATION_ID}/photos/presigned-url`,
        JSON.stringify({
          fileName: `photo_${__VU}_${Date.now()}.${ext}`,
          contentType,
        }),
        { headers, tags: { name: 'POST /invitations/:id/photos/presigned-url' } },
      );

      writeDuration.add(res.timings.duration);
      totalRequests.add(1);

      const ok = check(res, {
        'presigned-url: 201': (r) => r.status === 201,
      });
      errorRate.add(ok ? 0 : 1);

      sleep(0.3 + Math.random() * 0.5);
    });
  } else if (rand < 0.95) {
    // --- 참가자 목록 조회 ---
    group('participants_read', () => {
      const res = http.get(
        `${BASE_URL}/invitations/${INVITATION_ID}/participants`,
        { headers, tags: { name: 'GET /invitations/:id/participants' } },
      );

      readDuration.add(res.timings.duration);
      totalRequests.add(1);

      const ok = check(res, {
        'participants list: 200 or 403': (r) => r.status === 200 || r.status === 403,
      });
      // 403(비참가자)은 정상 비즈니스 케이스
      errorRate.add(res.status === 200 || res.status === 403 ? 0 : 1);

      sleep(0.5 + Math.random() * 0.5);
    });
  } else {
    // --- 사진 목록 조회 ---
    group('photos_read', () => {
      const res = http.get(
        `${BASE_URL}/invitations/${INVITATION_ID}/photos`,
        { headers, tags: { name: 'GET /invitations/:id/photos' } },
      );

      readDuration.add(res.timings.duration);
      totalRequests.add(1);

      const ok = check(res, {
        'photos list: 200': (r) => r.status === 200,
      });
      errorRate.add(ok ? 0 : 1);

      sleep(0.5 + Math.random() * 1);
    });
  }
}
