// 시나리오: 호스트가 본인 초대장 목록 조회
//   GET /invitations  → invitationsService.findAll(user.id)
// 측정 포인트: invitations.user_id 인덱스 부재 → 5000행 풀스캔
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const hostTokens = new SharedArray('hostTokens', () => {
  const data = JSON.parse(open('../apps/api/drizzle/seed/seed-tokens.json'));
  return data.hosts.map((h) => h.token);
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
  const token = hostTokens[Math.floor(Math.random() * hostTokens.length)];
  const res = http.get(`${BASE_URL}/invitations`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'GET /invitations' },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
  });
  sleep(0.5);
}
