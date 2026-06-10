import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * rate limit 버킷을 인증된 요청은 userId, 비로그인 요청은 IP로 분리한다.
 *
 * 기본 ThrottlerGuard는 IP만 추적해서, 같은 NAT/네트워크의 여러 사용자(또는 한 사용자가
 * 짧은 시간에 여러 동작)가 60req/분 버킷을 공유해 무고하게 429를 맞는 문제가 있었다.
 * JwtAuthGuard가 ThrottlerGuard보다 먼저 실행되어 req.user를 채우므로, 그 id를 키로 쓴다.
 * (비로그인/순서 누락 시 IP로 폴백)
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req?.user as { id?: string } | undefined;
    const ip = (req?.ip as string | undefined) ?? 'unknown';
    return user?.id ? `user:${user.id}` : `ip:${ip}`;
  }
}
