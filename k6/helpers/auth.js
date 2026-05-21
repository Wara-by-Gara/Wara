/**
 * K6 인증 헬퍼
 *
 * WARA API는 카카오/네이버/애플 OAuth 기반 소셜 로그인을 사용하므로
 * 실제 OAuth 플로우를 K6에서 자동화하기 어렵다.
 * 대신 두 가지 방법을 제공한다:
 *
 * 1. 환경변수로 미리 발급된 토큰 주입 (권장)
 *    k6 run -e ACCESS_TOKEN=xxx -e REFRESH_TOKEN=xxx script.js
 *
 * 2. 여러 사용자 시뮬레이션: TOKENS 배열에 여러 토큰을 넣어 VU별로 분배
 *    k6 run -e TOKENS='["tok1","tok2",...]' script.js
 */

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

/**
 * 환경변수에서 단일 Access Token을 읽어온다.
 * CI나 단일 사용자 시나리오에서 사용.
 *
 * @returns {string} JWT Access Token
 */
export function getAccessToken() {
  const token = __ENV.ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'ACCESS_TOKEN 환경변수가 설정되지 않았습니다.\n' +
      '실행 예시: k6 run -e ACCESS_TOKEN=your_jwt_token script.js',
    );
  }
  return token;
}

/**
 * 환경변수 TOKENS JSON 배열에서 VU 인덱스에 맞는 토큰을 선택한다.
 * 다중 사용자 시뮬레이션에서 사용.
 *
 * @param {number} vuId - K6 __VU (1부터 시작)
 * @returns {string} JWT Access Token
 */
export function getTokenForVu(vuId) {
  const raw = __ENV.TOKENS;
  if (!raw) {
    // TOKENS가 없으면 단일 토큰 폴백 — 멀티 VU 시나리오에서는 모든 VU가 같은 토큰을 공유한다
    console.warn(
      `[VU ${vuId}] TOKENS 환경변수가 없어 단일 ACCESS_TOKEN으로 폴백합니다. ` +
      '멀티 사용자 시나리오에서는 TOKENS=\'["tok1","tok2",...]\' 형태로 제공하세요.',
    );
    return getAccessToken();
  }
  const tokens = JSON.parse(raw);
  if (!tokens.length) {
    throw new Error('TOKENS 배열이 비어 있습니다.');
  }
  // VU 수가 토큰 수보다 많으면 순환(round-robin)
  return tokens[(vuId - 1) % tokens.length];
}

/**
 * Authorization Bearer 헤더를 포함한 공통 헤더를 반환한다.
 *
 * @param {string} token - JWT Access Token
 * @returns {Object} HTTP 헤더 객체
 */
export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Refresh Token으로 새 Access Token을 발급한다.
 * POST /auth/refresh
 *
 * @param {string} refreshToken - JWT Refresh Token
 * @returns {{ accessToken: string, refreshToken: string } | null}
 */
export function refreshToken(refreshToken) {
  const res = http.post(
    `${BASE_URL}/auth/refresh`,
    JSON.stringify({ refreshToken }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const ok = check(res, {
    'refresh: status 200': (r) => r.status === 200,
  });

  if (!ok) {
    console.error(`Token refresh 실패: ${res.status} ${res.body}`);
    return null;
  }

  const body = JSON.parse(res.body);
  return {
    accessToken: body.data?.accessToken ?? body.accessToken,
    refreshToken: body.data?.refreshToken ?? body.refreshToken,
  };
}
