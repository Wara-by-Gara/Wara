/**
 * WARA API 공통 성능 목표 (thresholds)
 *
 * 모든 시나리오에서 공유하는 기준선이다.
 * 시나리오별로 override 하려면 spread 후 특정 키를 덮어써라.
 *
 * @example
 * import { defaultThresholds } from '../thresholds.js';
 * export const options = {
 *   thresholds: { ...defaultThresholds, http_req_duration: ['p(95)<1000'] },
 * };
 */
export const defaultThresholds = {
  // 응답 시간: 95%가 500ms 이내, 99%가 1000ms 이내
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  // 에러율: 1% 미만
  http_req_failed: ['rate<0.01'],
};
