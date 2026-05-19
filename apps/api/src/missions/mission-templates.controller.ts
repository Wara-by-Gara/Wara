import { Controller, Get } from '@nestjs/common';
import { MissionsService } from './missions.service';

/**
 * 미션 공용 카탈로그.
 * GET /missions/templates — 인증된 모든 유저 (호스트가 모임에 추가할 때 참고용).
 */
@Controller('missions/templates')
export class MissionTemplatesController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  async list() {
    return this.missionsService.listTemplates();
  }
}
