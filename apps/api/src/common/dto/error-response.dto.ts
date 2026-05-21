import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorDetailDto {
  @ApiProperty({ example: 'INVITATION_NOT_FOUND' })
  code: string;

  @ApiProperty({ example: 'not_found' })
  type: string;

  @ApiProperty({ example: 'INVITATION_NOT_FOUND' })
  message: string;

  @ApiPropertyOptional({ description: '검증 실패 등 부가 정보' })
  details?: unknown;
}

export class ErrorMetaDto {
  @ApiProperty({ example: '01JVXXXXXXXXXXXXXXXXXXX' })
  requestId: string;

  @ApiProperty({ example: '2026-05-21T00:00:00.000Z' })
  timestamp: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: false;

  @ApiProperty({ type: ErrorDetailDto })
  error: ErrorDetailDto;

  @ApiProperty({ type: ErrorMetaDto })
  meta: ErrorMetaDto;
}
