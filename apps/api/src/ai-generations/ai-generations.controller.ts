import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { AiGenerationsService } from './ai-generations.service';
import {
  CreateAiGenerationDto,
  CreateAiGenerationSchema,
} from './dto/create-ai-generation.dto';

@Controller('ai/generations')
export class AiGenerationsController {
  constructor(private readonly service: AiGenerationsService) {}

  // 초대장 만들기 단계의 대표 이미지에 프리셋 보정을 적용. 응답 즉시 반환,
  // 실제 처리는 백그라운드. 완료 알림은 WS `/ai-generations` namespace로 push.
  //
  // Throttle (3req/60s): 더블클릭/스크립트 burst 방어용. 일일 한도(3/일)는
  // Service에서 ai_image_jobs와 합산하여 별도 적용 — 두 계층이 역할이 다름.
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  create(
    @Body(new ZodValidationPipe(CreateAiGenerationSchema)) dto: CreateAiGenerationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createGeneration(dto, user.id);
  }

  // 폴링용 fallback. WS를 못 받을 환경(모바일 백그라운드 진입 후 복귀 등)에서도 상태 확인.
  @Get(':id')
  get(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getGeneration(id, user.id);
  }
}
