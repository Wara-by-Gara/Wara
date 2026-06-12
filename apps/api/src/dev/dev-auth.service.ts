import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from '../auth/auth.repository';
import { AuthService } from '../auth/auth.service';
import { TermsRepository } from '../terms/terms.repository';
import { UserRole } from '../common/enums/role.enum';
import { ErrorCode } from '../common/constants/error-codes';
import type { JwtPayload } from '../common/types/jwt-payload.type';

// 시드 유저 화이트리스트 — mobile `apps/mobile/api/dev-auth.ts`의 DEV_USER_EMAILS와 동기화 필요.
// DB seed 패턴: apps/api/drizzle/seed/fixtures.ts:238 `String(i+1).padStart(3, '0')` → host001~
const DEV_USER_WHITELIST = new Set([
  'host001@wara.dev',
  'host002@wara.dev',
  'host003@wara.dev',
  'host004@wara.dev',
  'guest001@wara.dev',
  'guest002@wara.dev',
  'guest003@wara.dev',
  'admin@wara.dev',
]);

@Injectable()
export class DevAuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService,
    private readonly termsRepository: TermsRepository,
  ) {}

  async issueDevToken(email: string): Promise<{ accessToken: string }> {
    if (!DEV_USER_WHITELIST.has(email)) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_USER_NOT_FOUND,
        message: '허용되지 않은 dev 계정입니다.',
      });
    }

    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.AUTH_USER_NOT_FOUND,
        message: 'dev 시드 유저를 찾을 수 없습니다. seed 스크립트를 먼저 실행하세요.',
      });
    }

    // 필수 활성 약관 자동 동의 — dev 흐름의 목적은 "빠른 인증된 상태 진입".
    // RequiredTermsGuard가 모든 인증 API를 403으로 막지 않도록 누락분 보강.
    await this.ensureRequiredAgreements(user.id);

    const payload: JwtPayload = {
      id: user.id,
      role: user.role as UserRole,
      scope: user.role === UserRole.ADMIN ? ['admin'] : [],
    };

    const accessToken = await this.authService.issueAccessToken(payload);
    return { accessToken };
  }

  // 브라우저 dev 로그인용 — access + refresh 둘 다 발급 (refresh로 세션 유지)
  async issueDevSession(
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!DEV_USER_WHITELIST.has(email)) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_USER_NOT_FOUND,
        message: '허용되지 않은 dev 계정입니다.',
      });
    }
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.AUTH_USER_NOT_FOUND,
        message: 'dev 시드 유저를 찾을 수 없습니다.',
      });
    }
    await this.ensureRequiredAgreements(user.id);
    const payload: JwtPayload = {
      id: user.id,
      role: user.role as UserRole,
      scope: user.role === UserRole.ADMIN ? ['admin'] : [],
    };
    const accessToken = await this.authService.issueAccessToken(payload);
    const refreshToken = await this.authService.issueRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  private async ensureRequiredAgreements(userId: string): Promise<void> {
    const activeTerms = await this.termsRepository.findAllActive();
    const requiredTerms = activeTerms.filter((t) => t.isRequired);
    if (requiredTerms.length === 0) return;

    const existing = await this.termsRepository.findAgreementsByUser(userId);
    const agreedIds = new Set(existing.map((a) => a.termId));
    const missingIds = requiredTerms
      .filter((t) => !agreedIds.has(t.id))
      .map((t) => t.id);
    if (missingIds.length === 0) return;

    await this.termsRepository.createAgreements(userId, missingIds);
  }
}
