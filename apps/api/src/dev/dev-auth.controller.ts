/**
 * 개발 전용 토큰 발급 컨트롤러
 *
 * 시드 유저 이메일을 Body로 받아 유효한 JWT accessToken을 반환
 * NODE_ENV=development일 때만 app.module.ts에 등록됨
 *
 * 사용법:
 *   POST /api/v1/auth/dev/token
 *   { "email": "host1@wara.dev" }
 *
 * 시드 유저 이메일 목록: host1~4@wara.dev, guest01~14@wara.dev, admin@wara.dev
 */
import { Controller, Post, Body, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { AuthService } from '../auth/auth.service';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/enums/role.enum';
import { users } from '../../drizzle/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { z } from 'zod';

const devTokenSchema = z.object({ email: z.string().email() });

@Controller('auth/dev')
export class DevAuthController {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private readonly authService: AuthService,
  ) {}

  // @Public() — 인증 없이 접근 가능 (개발 전용이므로 허용)
  @Public()
  @Post('token')
  async getTestToken(@Body() body: unknown) {
    const { email } = devTokenSchema.parse(body);
    const user = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1)
      .then((r) => r[0]);

    if (!user) {
      throw new NotFoundException(`유저를 찾을 수 없습니다: ${email}`);
    }

    const accessToken = await this.authService.issueAccessToken({
      id: user.id,
      role: user.role as UserRole,
      scope: [],
    });

    return { accessToken };
  }
}
