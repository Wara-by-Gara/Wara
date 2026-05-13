import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Zod 스키마로 요청 데이터를 검증하는 파이프
 *
 * 사용법: 컨트롤러 @Body()에 직접 주입
 *   @Body(new ZodValidationPipe(UpdateRsvpSchema)) dto: UpdateRsvpDto
 *
 * 성공: schema.parse 결과를 그대로 반환 (타입 안전)
 * 실패: 400 BadRequestException + Zod 에러 메시지 반환
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    return result.data;
  }
}
