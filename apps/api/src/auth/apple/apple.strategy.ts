import {
  GatewayTimeoutException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';
import { ErrorCode } from '../../common/constants/error-codes';

@Injectable()
export class AppleStrategy {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  verifyState(state: string): void {
    try {
      this.jwtService.verify(state, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_INVALID_STATE,

        message: '유효하지 않은 state입니다.',
      });
    }
  }

  async verifyIdToken(idToken: string) {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new GatewayTimeoutException({
              code: ErrorCode.APPLE_SERVER_TIMEOUT,

              message: 'Apple 인증 서버 응답 시간이 초과되었습니다.',
            }),
          ),
        5000,
      ),
    );

    try {
      return await Promise.race([
        appleSignin.verifyIdToken(idToken, {
          audience: this.configService.getOrThrow<string>('APPLE_CLIENT_ID'),
        }),

        timeoutPromise,
      ]);
    } catch (err) {
      if (err instanceof GatewayTimeoutException) {
        throw err;
      }

      throw new UnauthorizedException({
        code: ErrorCode.AUTH_INVALID_TOKEN,

        message: '유효하지 않은 Apple id_token입니다.',
      });
    }
  }
}
