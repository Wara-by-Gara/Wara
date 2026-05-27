import { Controller, Get } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { Public } from '../common/decorators/public.decorator';

/**
 * 미션 공용 카탈로그.
 * GET /missions/templates — 비인증 허용 (초대장 생성 중 로그인 전에도 조회 가능).
 */
@Controller('missions/templates')
export class MissionTemplatesController {
  constructor(private readonly missionsService: MissionsService) {}

  @Public()
  @Get()
  async list() {
    return this.missionsService.listTemplates();
  }
}
