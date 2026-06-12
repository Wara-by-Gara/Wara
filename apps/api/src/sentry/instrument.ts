import * as Sentry from '@sentry/nestjs';

// prod-only + DSN optional: 둘 중 하나라도 없으면 init skip → captureException no-op.
// pino redaction(LoggerModule)과 동일한 9필드 마스킹으로 PII 누출 차단.
const dsn = process.env.SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

// Sentry 이벤트의 request.data에서 마스킹할 키. pino redact와 동일 키셋 유지.
// 단위 테스트가 직접 import해 적용 여부 검증.
export const SENTRY_BODY_REDACT_KEYS = [
  'password',
  'refreshToken',
  'accessToken',
  'code',
  'providerToken',
  'idToken',
  // 위치 좌표 — 5xx 발생 시 Sentry로 좌표 전송 차단 (개인정보보호 정책)
  'lat',
  'lng',
  'accuracy',
];

export function sentryBeforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  const headers = event.request?.headers;
  if (headers) {
    if (headers.authorization) headers.authorization = '[REDACTED]';
    if (headers.cookie) headers.cookie = '[REDACTED]';
    const setCookie = headers['set-cookie'];
    if (setCookie) headers['set-cookie'] = '[REDACTED]';
  }
  if (event.request?.cookies) {
    event.request.cookies = { redacted: '[REDACTED]' };
  }
  const data = event.request?.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const bag = data as Record<string, unknown>;
    for (const key of SENTRY_BODY_REDACT_KEYS) {
      if (key in bag) bag[key] = '[REDACTED]';
    }
  }
  return event;
}

if (dsn && isProd) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? 'production',
    tracesSampleRate: 0.1,
    profilesSampleRate: 0,
    beforeSend: sentryBeforeSend,
  });
}
