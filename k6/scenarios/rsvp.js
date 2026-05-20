/**
 * RSVP 동시성 테스트 시나리오
 *
 * 테스트 대상:
 *   - POST /invitations/:invitationId/participants       (초대장 참가)
 *   - PATCH /invitations/:invitationId/participants/:participantId/rsvp (RSVP 변경)
 *
 * 시나리오:
 *   50명이 동시에 같은 초대장에 참가하고, 이어서 RSVP 상태를 변경한다.
 *   - PARTICIPANT_ALREADY_EXISTS (409) 처리
 *   - 동시 참가 시 DB unique constraint 레이스 컨디션 검증
 *   - RSVP 변경의 동시성 안전성 검증
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=http://localhost:3001 \
 *     -e INVITATION_ID=01XXXXXXXXXXXXXXXXXXXXXXXXX \
 *     -e TOKENS='["token1","token2",..."token50"]' \
 *     k6/scenarios/rsvp.js
 *
 * 주의:
 *   TOKENS 배열의 각 토큰은 서로 다른 사용자의 JWT여야 한다.
 *   같은 사용자 토큰을 여러 VU에서 쓰면 409가 많이 발생한다.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { getTokenForVu, authHeaders } from '../helpers/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const INVITATION_ID = __ENV.INVITATION_ID || '01JVXXXXXXXXXXXXXXXXXXXXXXXXX';

// 커스텀 메트릭
const joinDuration = new Trend('rsvp_join_duration', true);
const rsvpChangeDuration = new Trend('rsvp_change_duration', true);
const errorRate = new Rate('rsvp_errors');
const alreadyExistsCount = new Counter('rsvp_already_exists');
const successfulJoins = new Counter('rsvp_successful_joins');

export const options = {
  scenarios: {
    // 50명이 동시에 참가 시도 후 RSVP 변경
    concurrent_rsvp: {
      executor: 'constant-vus',
      vus: 50,
      duration: '3m',
    },
  },
  thresholds: {
    // 참가 API: 500ms 이내 (DB write 포함)
    rsvp_join_duration: ['p(95)<500'],
    // RSVP 변경: 500ms 이내
    rsvp_change_duration: ['p(95)<500'],
    // 에러율 1% 미만 (409 Conflict는 정상 비즈니스 케이스로 제외)
    rsvp_errors: ['rate<0.01'],
    http_req_failed: ['rate<0.05'],
  },
};

// RSVP 상태 목록 — 랜덤 변경에 사용
const RSVP_STATUSES = ['attending', 'undecided', 'absent'];

/**
 * 현재 VU의 참가자 ID를 저장.
 * setup()에서 채울 수 없으므로 각 VU iteration에서 관리한다.
 */
let myParticipantId = null;

export default function () {
  const token = getTokenForVu(__VU);
  const headers = authHeaders(token);

  // --- 1단계: 초대장 참가 ---
  if (!myParticipantId) {
    const joinBody = JSON.stringify({
      rsvpStatus: 'attending',
    });

    const joinRes = http.post(
      `${BASE_URL}/invitations/${INVITATION_ID}/participants`,
      joinBody,
      { headers, tags: { name: 'POST /invitations/:id/participants' } },
    );

    joinDuration.add(joinRes.timings.duration);

    if (joinRes.status === 201) {
      // 참가 성공
      successfulJoins.add(1);
      try {
        const body = JSON.parse(joinRes.body);
        // 응답에서 참가자 ID 추출 (응답 구조에 맞게 조정)
        myParticipantId =
          body.data?.id ??
          body.data?.participantId ??
          body.id ??
          body.participantId;
      } catch {
        console.error(`참가 응답 파싱 실패 [VU ${__VU}]: ${joinRes.body}`);
      }

      check(joinRes, {
        'join: status 201': (r) => r.status === 201,
        'join: has participantId': () => myParticipantId !== null,
      });
    } else if (joinRes.status === 409) {
      // 이미 참가한 상태 — 정상 비즈니스 케이스
      alreadyExistsCount.add(1);

      // me 엔드포인트로 본인 참가자 정보를 가져온다
      const meRes = http.get(
        `${BASE_URL}/invitations/${INVITATION_ID}/participants/me`,
        { headers, tags: { name: 'GET /invitations/:id/participants/me' } },
      );
      if (meRes.status === 200) {
        try {
          const body = JSON.parse(meRes.body);
          myParticipantId =
            body.participant?.id ??
            body.data?.id ??
            body.id;
        } catch {
          console.error(`me 응답 파싱 실패 [VU ${__VU}]: ${meRes.body}`);
        }
      }
    } else {
      // 예상치 못한 에러
      errorRate.add(1);
      console.error(`참가 실패 [VU ${__VU}]: ${joinRes.status} ${joinRes.body}`);
      check(joinRes, { 'join: unexpected error': () => false });
      sleep(1);
      return;
    }

    errorRate.add(0);
  }

  // 참가자 ID를 아직 모르는 경우 스킵
  if (!myParticipantId) {
    sleep(1);
    return;
  }

  // 실제 사용자 행동 모사: 참가 후 잠시 대기
  sleep(0.5 + Math.random() * 0.5);

  // --- 2단계: RSVP 상태 변경 ---
  // 랜덤으로 상태를 선택해 동시 변경 동시성 검증
  const newStatus = RSVP_STATUSES[Math.floor(Math.random() * RSVP_STATUSES.length)];

  const rsvpRes = http.patch(
    `${BASE_URL}/invitations/${INVITATION_ID}/participants/${myParticipantId}/rsvp`,
    JSON.stringify({ rsvpStatus: newStatus }),
    { headers, tags: { name: 'PATCH /invitations/:id/participants/:id/rsvp' } },
  );

  rsvpChangeDuration.add(rsvpRes.timings.duration);

  const rsvpOk = check(rsvpRes, {
    'rsvp change: status 200': (r) => r.status === 200,
    'rsvp change: status 200 or 422': (r) => r.status === 200 || r.status === 422,
  });

  if (!rsvpOk && rsvpRes.status !== 422) {
    // 422는 마감된 초대장 — 비즈니스 에러이므로 메트릭에서 제외
    errorRate.add(1);
    console.error(`RSVP 변경 실패 [VU ${__VU}]: ${rsvpRes.status} → ${newStatus}`);
  } else {
    errorRate.add(0);
  }

  // 다음 iteration 전 대기 (1~2초)
  sleep(1 + Math.random());
}
