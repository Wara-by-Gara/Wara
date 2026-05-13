import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { NaverService } from './naver.service';

@Controller('auth/naver')
export class NaverController {
  constructor(
    private readonly naverService: NaverService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  redirect(@Res() res: Response) {
    return res.redirect(302, this.naverService.getAuthUrl());
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken } = await this.naverService.handleCallback(code, state);
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    return res.redirect(302, redirectUrl);
  }
}
