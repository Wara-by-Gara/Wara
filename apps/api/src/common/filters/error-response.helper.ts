import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

const CODE_PATTERN = /^[A-Z][A-Z0-9_]+$/;

type ErrorType =
  | 'invalid_request'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'rate_limit'
  | 'service_unavailable'
  | 'server_error';

function statusToType(status: number): ErrorType {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'invalid_request';
    case HttpStatus.UNAUTHORIZED:
      return 'authentication';
    case HttpStatus.FORBIDDEN:
      return 'authorization';
    case HttpStatus.NOT_FOUND:
      return 'not_found';
    case HttpStatus.CONFLICT:
      return 'conflict';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'rate_limit';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'service_unavailable';
    default:
      return 'server_error';
  }
}

function statusToDefaultCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'INVALID_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHENTICATED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'VALIDATION_ERROR';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMIT_EXCEEDED';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'INTERNAL_ERROR';
  }
}

function extractRawMessage(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && 'message' in raw) {
    return (raw as { message: unknown }).message;
  }
  return raw;
}

function pickCode(raw: unknown, status: number): string {
  const message = extractRawMessage(raw);
  if (typeof message === 'string' && CODE_PATTERN.test(message)) {
    return message;
  }
  return statusToDefaultCode(status);
}

function pickMessage(raw: unknown, status: number): string {
  const message = extractRawMessage(raw);
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join(', ');
  return statusToDefaultCode(status);
}

export function sendErrorResponse(
  host: ArgumentsHost,
  status: number,
  raw: unknown,
): void {
  const ctx = host.switchToHttp();
  const request = ctx.getRequest<Request>();
  const response = ctx.getResponse<Response>();
  const headerRequestId = request.headers['x-request-id'];
  const requestId =
    typeof headerRequestId === 'string' && headerRequestId.length > 0
      ? headerRequestId
      : randomUUID();

  response.status(status).json({
    success: false,
    error: {
      code: pickCode(raw, status),
      type: statusToType(status),
      message: pickMessage(raw, status),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
