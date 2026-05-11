import { Injectable, BadRequestException, PipeTransform } from '@nestjs/common';

/**
 * ULID 형식 검증 파이프
 * SKILL Rule: Path param ID는 반드시 ParseUlidPipe를 붙여서
 * 형식 틀리면 자동 400 Bad Request 반환
 *
 * 사용: @Param('id', ParseUlidPipe) id: string
 * 유효하지 않은 ULID 형식이면 파이프에서 BadRequestException 던짐
 */
@Injectable()
export class ParseUlidPipe implements PipeTransform {
  transform(value: string) {
    // ULID: 26자리 Crockford Base32 (0-9, A-Z 제외 I L O U)
    if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(value)) {
      throw new BadRequestException(`"${value}"는 유효한 ULID 형식이 아닙니다`);
    }
    return value;
  }
}
