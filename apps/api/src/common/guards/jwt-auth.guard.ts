import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 인증 가드
 * SKILL Rule: 인증이 필요한 라우트에 @UseGuards(JwtAuthGuard) 붙이면
 * 자동으로 토큰 검증 → 토큰 없거나 만료되면 401 반환
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
