/**
 * 트랙 A — 위치 공유 개인정보 정책 회귀 방지 (BE 단위)
 *
 * 검증 대상:
 * - LOC-PRIV-02: pino redact가 GPS 좌표(lat/lng/accuracy)를 [REDACTED]로 마스킹
 * - LOC-PRIV-03: Sentry beforeSend가 5xx 이벤트의 좌표를 [REDACTED]로 마스킹
 *
 * 정책 정의는 logger.module.ts(LOG_REDACT_PATHS)와 sentry/instrument.ts
 * (SENTRY_BODY_REDACT_KEYS)에 단일 source of truth로 위치. 본 테스트는
 * 그 정책이 실제 pino/Sentry beforeSend 흐름에서 적용되는지를 직접 행위로 검증.
 */
import type * as Sentry from '@sentry/nestjs';
import pino from 'pino';
import {
  LOG_REDACT_CENSOR,
  LOG_REDACT_PATHS,
} from '../logger/logger.module';
import {
  SENTRY_BODY_REDACT_KEYS,
  sentryBeforeSend,
} from '../sentry/instrument';

describe('LOC-PRIV-02 · pino redact는 GPS 좌표를 [REDACTED]로 마스킹', () => {
  function captureLog(): { logger: pino.Logger; getLast: () => unknown } {
    const lines: string[] = [];
    const stream = { write: (msg: string) => lines.push(msg) };
    const logger = pino(
      {
        level: 'info',
        redact: { paths: LOG_REDACT_PATHS, censor: LOG_REDACT_CENSOR },
      },
      stream as pino.DestinationStream,
    );
    return {
      logger,
      getLast: () => JSON.parse(lines[lines.length - 1]!) as unknown,
    };
  }

  it('req.body.lat / lng / accuracy → [REDACTED]', () => {
    const { logger, getLast } = captureLog();
    logger.info({
      req: { body: { lat: 37.4979, lng: 127.0276, accuracy: 5.0 } },
    });
    const log = getLast() as { req: { body: Record<string, unknown> } };
    expect(log.req.body.lat).toBe('[REDACTED]');
    expect(log.req.body.lng).toBe('[REDACTED]');
    expect(log.req.body.accuracy).toBe('[REDACTED]');
  });

  it('좌표 외 필드(predicate)는 그대로 통과 — over-redaction 회귀 방지', () => {
    const { logger, getLast } = captureLog();
    logger.info({
      req: {
        body: { lat: 37.5, lng: 127.0, nickname: 'minsung', status: 'ok' },
      },
    });
    const log = getLast() as { req: { body: Record<string, unknown> } };
    expect(log.req.body.nickname).toBe('minsung');
    expect(log.req.body.status).toBe('ok');
    expect(log.req.body.lat).toBe('[REDACTED]');
  });

  it('LOG_REDACT_PATHS 정책 자체에 lat/lng/accuracy 누락 없음', () => {
    expect(LOG_REDACT_PATHS).toEqual(
      expect.arrayContaining([
        'req.body.lat',
        'req.body.lng',
        'req.body.accuracy',
      ]),
    );
  });
});

describe('LOC-PRIV-03 · Sentry beforeSend는 좌표 breadcrumb을 [REDACTED]로 마스킹', () => {
  // ErrorEvent의 필수 필드(type: undefined)를 채워주는 헬퍼
  const makeEvent = (partial: Partial<Sentry.ErrorEvent>): Sentry.ErrorEvent =>
    ({ type: undefined, ...partial }) as Sentry.ErrorEvent;

  it('event.request.data의 lat / lng / accuracy → [REDACTED]', () => {
    const sanitized = sentryBeforeSend(
      makeEvent({
        request: {
          data: {
            lat: 37.4979,
            lng: 127.0276,
            accuracy: 5.0,
            nickname: 'minsung',
          },
        },
      }),
    );
    const data = sanitized.request!.data as Record<string, unknown>;
    expect(data.lat).toBe('[REDACTED]');
    expect(data.lng).toBe('[REDACTED]');
    expect(data.accuracy).toBe('[REDACTED]');
    // 좌표 외 필드는 보존
    expect(data.nickname).toBe('minsung');
  });

  it('인증 헤더도 함께 [REDACTED] — 기존 정책 회귀 방지', () => {
    const sanitized = sentryBeforeSend(
      makeEvent({
        request: {
          headers: { authorization: 'Bearer abc', cookie: 'session=x' },
          data: { lat: 37.5 },
        },
      }),
    );
    const headers = sanitized.request!.headers as Record<string, string>;
    expect(headers.authorization).toBe('[REDACTED]');
    expect(headers.cookie).toBe('[REDACTED]');
  });

  it('request.data가 없으면 무영향 — null/undefined 안전성', () => {
    const event = makeEvent({});
    expect(() => sentryBeforeSend(event)).not.toThrow();
    expect(sentryBeforeSend(event)).toEqual(event);
  });

  it('SENTRY_BODY_REDACT_KEYS 정책 자체에 lat/lng/accuracy 누락 없음', () => {
    expect(SENTRY_BODY_REDACT_KEYS).toEqual(
      expect.arrayContaining(['lat', 'lng', 'accuracy']),
    );
  });
});
