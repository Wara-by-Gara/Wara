// 시나리오: 날씨 조회 — 격자 단위 캐시 hit/miss 응답시간 비교
//   GET /invitations/:invitationId/weather  → weatherService.getWeather(id)
//
// 측정 포인트:
//   - 캐시 COLD (첫 요청): Redis miss → KMA API 호출 → 캐시 저장
//   - 캐시 WARM (반복 요청): Redis hit → 즉시 응답
//   - 두 응답시간 차이로 캐시 효과 수치화
//
// 실행 방법:
//   # 1. 캐시 COLD 측정 (Redis flush 후)
//   redis-cli FLUSHDB
//   k6 run --env MODE=cold --summary-export=results/04-cold.json loadtest/04-weather-cache.js
//
//   # 2. 캐시 WARM 측정 (캐시 채워진 상태)
//   k6 run --env MODE=warm --summary-export=results/04-warm.json loadtest/04-weather-cache.js
//
//   # BASE_URL 변경 시
//   k6 run --env BASE_URL=http://localhost:3002/api/v1 loadtest/04-weather-cache.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend, Counter } from 'k6/metrics';

const coldDuration = new Trend('cold_req_duration_ms', true);
const warmDuration = new Trend('warm_req_duration_ms', true);
const cacheHit = new Counter('cache_hit');
const cacheMiss = new Counter('cache_miss');

// seed-tokens.json: (token, invitationId) 페어. 참가자여야 ParticipantGuard 통과.
const targets = new SharedArray('targets', () => {
  const data = JSON.parse(open('../apps/api/drizzle/seed/seed-tokens.json'));
  const pairs = [];
  for (const h of data.hosts) {
    for (const invId of h.invitationIds) pairs.push({ token: h.token, invitationId: invId });
  }
  for (const g of data.guests) {
    for (const invId of g.invitationIds) pairs.push({ token: g.token, invitationId: invId });
  }
  return pairs;
});

const MODE = __ENV.MODE || 'warm'; // 'cold' | 'warm'
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';

export const options = {
  scenarios: {
    weather_cache: {
      executor: 'constant-vus',
      vus: 20,
      duration: '1m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    // WARM: 캐시 hit → 빠른 응답 기대
    'warm_req_duration_ms{quantile:0.95}': MODE === 'warm' ? ['p(95)<200'] : [],
  },
};

export default function () {
  const t = targets[Math.floor(Math.random() * targets.length)];
  const url = `${BASE_URL}/invitations/${t.invitationId}/weather`;
  const headers = { Authorization: `Bearer ${t.token}` };

  const res = http.get(url, { headers, tags: { mode: MODE } });

  const ok = check(res, {
    'status 200 or 204': (r) => r.status === 200 || r.status === 204,
  });

  if (ok) {
    if (MODE === 'cold') {
      coldDuration.add(res.timings.duration);
      cacheMiss.add(1);
    } else {
      warmDuration.add(res.timings.duration);
      cacheHit.add(1);
    }
  }

  sleep(0.5);
}

export function handleSummary(data) {
  const cold = data.metrics['cold_req_duration_ms'];
  const warm = data.metrics['warm_req_duration_ms'];

  const lines = ['=== 날씨 캐시 부하 테스트 결과 ===\n'];

  if (cold) {
    lines.push(`[COLD - 캐시 miss / KMA API 직접 호출]`);
    lines.push(`  p50: ${cold.values['p(50)']?.toFixed(2)}ms`);
    lines.push(`  p95: ${cold.values['p(95)']?.toFixed(2)}ms`);
    lines.push(`  min: ${cold.values['min']?.toFixed(2)}ms`);
    lines.push(`  max: ${cold.values['max']?.toFixed(2)}ms\n`);
  }

  if (warm) {
    lines.push(`[WARM - 캐시 hit / Redis 즉시 응답]`);
    lines.push(`  p50: ${warm.values['p(50)']?.toFixed(2)}ms`);
    lines.push(`  p95: ${warm.values['p(95)']?.toFixed(2)}ms`);
    lines.push(`  min: ${warm.values['min']?.toFixed(2)}ms`);
    lines.push(`  max: ${warm.values['max']?.toFixed(2)}ms\n`);
  }

  if (cold && warm) {
    const coldP95 = cold.values['p(95)'];
    const warmP95 = warm.values['p(95)'];
    if (coldP95 && warmP95) {
      const ratio = (coldP95 / warmP95).toFixed(1);
      lines.push(`캐시 hit가 miss 대비 p95 기준 ${ratio}배 빠름`);
    }
  }

  return {
    stdout: lines.join('\n'),
  };
}
