import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { ErrorCode } from '../common/constants/error-codes';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { SocialProvider } from '../common/types/social-provider.type';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async getMe(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    return user;
  }

  async updateMe(userId: string, data: UpdateUserDto) {
    const updated = await this.repository.updateUser(userId, data);
    if (!updated) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    return updated;
  }

  async deleteMe(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    await Promise.all([
      this.repository.softDeleteUser(userId),
      this.repository.revokeAllRefreshTokens(userId),
    ]);
  }

  async getMySocials(userId: string) {
    return this.repository.findSocialsByUserId(userId);
  }

  async deleteMySocial(userId: string, provider: SocialProvider) {
    const social = await this.repository.findSocialByUserIdAndProvider(
      userId,
      provider,
    );
    if (!social) throw new NotFoundException(ErrorCode.USER_SOCIAL_NOT_FOUND);
    await this.repository.deleteSocialAccount(social.id);
  }

  async getUserById(targetId: string) {
    const user = await this.repository.findPublicById(targetId);
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    return user;
  }
}
