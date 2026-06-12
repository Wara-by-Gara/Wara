import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';
import { OgImageService } from './og-image.service';

@Controller('og-image')
export class OgImageController {
  constructor(
    private readonly ogImageService: OgImageService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get()
  async getOgImage(
    @Query('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const fallbackUrl = `${frontendUrl}/wara-logo.png`;

    if (!id) {
      res.redirect(302, fallbackUrl);
      return;
    }

    const result = await this.ogImageService.getOgImageBuffer(id);

    if (result.type === 'png') {
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(result.buffer);
      return;
    }

    res.redirect(302, fallbackUrl);
  }
}
