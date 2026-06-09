// 시나리오: 초대장 상세 조회 (공개 라우트)
//   GET /invitations/:invitationId  → invitationsService.findOne(id)
// 측정 포인트: baseline (PK lookup + 조인). 인덱스 효과 비교의 컨트롤군.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend, Counter } from 'k6/metrics';

const dbTime = new Trend('db_time_ms', true);
const dbQueryCount = new Trend('db_query_count');
const dbMissingHeader = new Counter('db_header_missing');

const invitationIds = new SharedArray('invitationIds', () => {
  const data = JSON.parse(open('../apps/api/drizzle/seed/seed-tokens.json'));
  const set = new Set();
  for (const h of data.hosts) for (const id of h.invitationIds) set.add(id);
  for (const g of data.guests) for (const id of g.invitationIds) set.add(id);
  return Array.from(set);
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
  const id = invitationIds[Math.floor(Math.random() * invitationIds.length)];
  const res = http.get(`${BASE_URL}/invitations/${id}`, {
    tags: { endpoint: 'GET /invitations/:id' },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
  });

  const dbTimeRaw = res.headers['X-Db-Time'] ?? res.headers['X-DB-Time'];
  const dbCountRaw = res.headers['X-Db-Query-Count'] ?? res.headers['X-DB-Query-Count'];
  if (dbTimeRaw !== undefined) {
    dbTime.add(parseFloat(dbTimeRaw));
    if (dbCountRaw !== undefined) dbQueryCount.add(parseInt(dbCountRaw, 10));
  } else {
    dbMissingHeader.add(1);
  }

  sleep(0.5);
}
