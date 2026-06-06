import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { ErrorCode } from '../common/constants/error-codes';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { DeleteUserDto } from './dto/delete-user.dto';
import type { SocialProvider } from '../common/types/social-provider.type';
import type { ProfileImagePresignedUrlDto } from './dto/profile-image-presigned-url.dto';
import { S3Service } from '../s3/s3.service';
import { ulid } from 'ulid';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly s3Service: S3Service,
  ) {}

  async generatePresignedUrl(userId: string, dto: ProfileImagePresignedUrlDto) {
    const key = `public/profiles/${userId}/${ulid()}/${dto.fileName}`;
    return this.s3Service.getUploadPresignedUrl(key, dto.contentType);
  }

  private isS3Key(value: string): boolean {
    return value.startsWith('public/profiles/');
  }

  private getViewUrl(key: string): string {
    return this.s3Service.getPublicUrl(key);
  }

  async getMe(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    if (user.profileImageUrl && this.isS3Key(user.profileImageUrl)) {
      return { ...user, profileImageUrl: this.getViewUrl(user.profileImageUrl) };
    }
    return user;
  }

  async updateMe(userId: string, data: UpdateUserDto) {
    const updated = await this.repository.updateUser(userId, data);
    if (!updated) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    if (updated.profileImageUrl && this.isS3Key(updated.profileImageUrl)) {
      return { ...updated, profileImageUrl: this.getViewUrl(updated.profileImageUrl) };
    }
    return updated;
  }

  async deleteMe(userId: string, dto: DeleteUserDto = {}) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    await this.repository.softDeleteUserWithCleanup(userId, {
      reason: dto.reason,
      detail: dto.detail,
    });
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
    // 마지막 소셜을 해제하면 user가 영구 로그인 불가 → 계정 lockout. 프론트도 막지만 API 직접 호출 방어.
    const remaining = await this.repository.countSocialsByUserId(userId);
    if (remaining <= 1) {
      throw new BadRequestException({
        code: ErrorCode.USER_SOCIAL_LAST_LINKED,
        message: '마지막 소셜 계정은 해제할 수 없어요. 다른 소셜을 먼저 연결해주세요.',
      });
    }
    await this.repository.deleteSocialAccount(social.id);
  }

  async getUserById(targetId: string) {
    const user = await this.repository.findPublicById(targetId);
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    if (user.profileImageUrl && this.isS3Key(user.profileImageUrl)) {
      return { ...user, profileImageUrl: this.getViewUrl(user.profileImageUrl) };
    }
    return user;
  }
}