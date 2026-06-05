// 시나리오: 초대장 참가자 목록 조회
//   GET /invitations/:invitationId/participants  → participantsService.findAll(invitationId, viewer)
// 측정 포인트: participants.invitation_id 단독 인덱스 부재
//   (uq_participants_user_invitation 는 (user_id, invitation_id) 순이라 leftmost 규칙상
//    invitation_id 단독 lookup에 못 씀 → 37496행 풀스캔)
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const targets = new SharedArray('targets', () => {
  const data = JSON.parse(open('../apps/api/drizzle/seed/seed-tokens.json'));
  // 호스트는 자기 초대장의 participant 이므로 (host, invitationId) 페어 다수 확보
  const pairs = [];
  for (const h of data.hosts) {
    for (const invId of h.invitationIds) pairs.push({ token: h.token, invitationId: invId });
  }
  return pairs;
});

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';

export default function () {
  const t = targets[Math.floor(Math.random() * targets.length)];
  const res = http.get(`${BASE_URL}/invitations/${t.invitationId}/participants`, {
    headers: { Authorization: `Bearer ${t.token}` },
    tags: { endpoint: 'GET /invitations/:id/participants' },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
  });
  sleep(0.5);
}
