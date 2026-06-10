import * as Sentry from '@sentry/nestjs';

// prod-only + DSN optional: 둘 중 하나라도 없으면 init skip → captureException no-op.
// pino redaction(LoggerModule)과 동일한 9필드 마스킹으로 PII 누출 차단.
const dsn = process.env.SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

if (dsn && isProd) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? 'production',
    tracesSampleRate: 0.1,
    profilesSampleRate: 0,
    beforeSend(event) {
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
        for (const key of [
          'password',
          'refreshToken',
          'accessToken',
          'code',
          'providerToken',
          'idToken',
        ]) {
          if (key in bag) bag[key] = '[REDACTED]';
        }
      }
      return event;
    },
  });
}
