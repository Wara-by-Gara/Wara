import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { SettlementsService } from './settlements.service';
import { SettlementImageService } from './settlement-image.service';

// 읽기전용 공유 링크 (비회원 접근). 익명화 설정이 켜져 있으면 이름이 '참가자 A/B/…'로 표기됨.
@Controller('public/settlements')
export class PublicSettlementController {
  constructor(
    private readonly service: SettlementsService,
    private readonly imageService: SettlementImageService,
  ) {}

  @Public()
  @Get(':token')
  getPublic(@Param('token', ParseUlidPipe) token: string) {
    return this.service.getPublicSummary(token);
  }

  @Public()
  @Get(':token/image')
  async getPublicImage(@Param('token', ParseUlidPipe) token: string, @Res() res: Response) {
    const summary = await this.service.getPublicSummary(token);
    const png = await this.imageService.renderCard(summary);
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-store');
    res.send(png);
  }
}
