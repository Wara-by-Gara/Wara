import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

// NestJS pipeline은 Guard → Pipe 순이므로 Guard에서도 path param ULID 검증을 위해 export
export const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/**
 * Path param ID의 ULID 형식 검증 파이프.
 *
 * 사용: `@Param('id', ParseUlidPipe) id: string`
 *
 * 실패 시 400 + envelope:
 *   { error: { code: 'INVALID_ULID', details: { value } } }
 */
@Injectable()
export class ParseUlidPipe implements PipeTransform {
  constructor(private readonly options?: { optional?: boolean }) {}

  transform(value: string): string | undefined {
    if (this.options?.optional && !value) return undefined;

    if (!ULID_PATTERN.test(value)) {
      throw new BadRequestException({
        message: ErrorCode.INVALID_ULID,
        details: { value },
      });
    }
    return value;
  }
}
