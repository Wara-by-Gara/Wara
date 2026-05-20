/**
 * 초대장 조회 시나리오
 *
 * 테스트 대상:
 *   - GET /invitations/:invitationId           (Public — 인증 불필요)
 *   - GET /invitations/:invitationId/participants (인증 필요, ParticipantGuard)
 *
 * 시나리오:
 *   동시 100명이 같은 초대장 페이지를 조회한다.
 *   실제 서비스에서 이벤트 링크가 공유될 때 발생하는 트래픽 패턴을 모사한다.
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=http://localhost:3001 \
 *     -e INVITATION_ID=01XXXXXXXXXXXXXXXXXXXXXXXXX \
 *     -e ACCESS_TOKEN=your_jwt_token \
 *     k6/scenarios/invitation.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { getTokenForVu, authHeaders } from '../helpers/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// 환경변수로 주입하거나 테스트 전 실제 ULID로 교체한다
const INVITATION_ID = __ENV.INVITATION_ID || '01JVXXXXXXXXXXXXXXXXXXXXXXXXX';

// 커스텀 메트릭
const invitationDetailDuration = new Trend('invitation_detail_duration', true);
const participantListDuration = new Trend('participant_list_duration', true);
const errorRate = new Rate('invitation_errors');

export const options = {
  scenarios: {
    // 동시 100명이 같은 초대장 페이지를 지속적으로 조회
    concurrent_viewers: {
      executor: 'constant-vus',
      vus: 100,
      duration: '2m',
    },
  },
  thresholds: {
    // 초대장 상세 조회는 200ms 이내 응답 (Public API, 캐시 가능)
    invitation_detail_duration: ['p(95)<200'],
    // 참가자 목록은 500ms 이내 응답 (DB 조회 포함)
    participant_list_duration: ['p(95)<500'],
    // 에러율 1% 미만
    invitation_errors: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const token = getTokenForVu(__VU);
  const headers = authHeaders(token);
  const publicHeaders = { 'Content-Type': 'application/json' };

  // 1. 초대장 상세 조회 (Public — 인증 없이도 접근 가능)
  const detailRes = http.get(
    `${BASE_URL}/invitations/${INVITATION_ID}`,
    { headers: publicHeaders, tags: { name: 'GET /invitations/:id' } },
  );

  invitationDetailDuration.add(detailRes.timings.duration);

  const detailOk = check(detailRes, {
    'invitation detail: status 200': (r) => r.status === 200,
    'invitation detail: has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined || body.id !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!detailOk) {
    errorRate.add(1);
    console.error(`초대장 상세 조회 실패 [VU ${__VU}]: ${detailRes.status}`);
  } else {
    errorRate.add(0);
  }

  // 실제 사용자 행동 모사: 페이지 렌더링 후 참가자 목록 요청
  sleep(0.3);

  // 2. 참가자 목록 조회 (인증 필요 — ParticipantGuard)
  const participantsRes = http.get(
    `${BASE_URL}/invitations/${INVITATION_ID}/participants`,
    { headers, tags: { name: 'GET /invitations/:id/participants' } },
  );

  participantListDuration.add(participantsRes.timings.duration);

  const participantsOk = check(participantsRes, {
    'participants list: status 200': (r) => r.status === 200,
    'participants list: has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  if (!participantsOk) {
    // 참가자가 아닌 VU의 경우 403이 정상 응답이므로 구분
    if (participantsRes.status !== 403) {
      errorRate.add(1);
      console.error(`참가자 목록 조회 실패 [VU ${__VU}]: ${participantsRes.status}`);
    } else {
      errorRate.add(0);
    }
  } else {
    errorRate.add(0);
  }

  // 사용자가 페이지를 읽는 시간 모사 (1~3초)
  sleep(1 + Math.random() * 2);
}
