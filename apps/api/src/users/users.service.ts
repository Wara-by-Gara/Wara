import { Injectable, NotFoundException } from '@nestjs/common';
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
    await this.repository.softDeleteUser(userId, {
      reason: dto.reason,
      detail: dto.detail,
    });
    await this.repository.deleteSocialAccountsByUserId(userId);
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
    if (user.profileImageUrl && this.isS3Key(user.profileImageUrl)) {
      return { ...user, profileImageUrl: this.getViewUrl(user.profileImageUrl) };
    }
    return user;
  }
}