import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppleCallbackDto } from './apple-callback.dto';
import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';
import { AppleStrategy } from './apple.strategy';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { ErrorCode } from '../../common/constants/error-codes';
import { UserRole } from '../../common/enums/role.enum';
import { Provider } from '../enums/provider.enum';
import { randomUUID } from 'crypto';

export interface AppleLoginResult {
  accessToken: string;
  refreshToken: string;
  isNew: boolean;
  needsProfileCompletion: boolean;
}

@Injectable()
export class AppleService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService,
    private readonly appleStrategy: AppleStrategy,
  ) {}

  generateState(): string {
    return this.jwtService.sign(
      {
        nonce: randomUUID(),
      },

      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '10m',
      },
    );
  }

  async login(dto: AppleCallbackDto): Promise<AppleLoginResult> {
    if (dto.state) {
      this.appleStrategy.verifyState(dto.state);
    }

    const payload = await this.appleStrategy.verifyIdToken(dto.id_token);

    const name = dto.user?.name
      ? [dto.user.name.firstName, dto.user.name.lastName]
          .filter(Boolean)
          .join(' ')
      : undefined;

    const { userId, isNew } = await this.authRepository.upsertSocialAccount({
      provider: Provider.APPLE,
      providerAccountId: payload.sub,
      email: payload.email ?? dto.user?.email,
      name,
    });

    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_USER_NOT_FOUND,
        message: '유저 정보를 찾을 수 없습니다.',
      });
    }

    const jwtPayload: JwtPayload = {
      id: user.id,
      role: user.role as UserRole,
      scope: user.role === UserRole.ADMIN ? ['admin'] : [],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.authService.issueAccessToken(jwtPayload),
      this.authService.issueRefreshToken(userId),
    ]);

    const needsProfileCompletion = !user.name || !user.email || !user.birthYear;
    return {
      accessToken,
      refreshToken,
      isNew,
      needsProfileCompletion,
    };
  }
}
