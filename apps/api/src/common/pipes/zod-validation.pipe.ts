import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z, ZodType } from 'zod';
import { ErrorCode } from '../constants/error-codes';

/**
 * Zod 스키마 기반 요청 검증 파이프.
 *
 * 사용:
 *   @Body(new ZodValidationPipe(UpdateRsvpSchema)) dto: UpdateRsvpDto
 *
 * 실패 응답 envelope (error-response.helper):
 *   { error: { code: 'VALIDATION_ERROR', message: 'VALIDATION_ERROR', details: <tree> } }
 *   - details: `z.treeifyError(error)` 결과 — Zod v4 권장 직렬화.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: ErrorCode.VALIDATION_ERROR,
        details: z.treeifyError(result.error),
      });
    }
    return result.data;
  }
}
