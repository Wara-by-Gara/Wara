import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { ErrorCode } from '../common/constants/error-codes';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { SocialProvider } from '../common/types/social-provider.type';
import type { ProfileImagePresignedUrlDto } from './dto/profile-image-presigned-url.dto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_CLIENT } from '../s3/s3.module';
import { ConfigService } from '@nestjs/config';
import { ulid } from 'ulid';

@Injectable()
export class UsersService {
  private readonly bucket: string;

  constructor(
    private readonly repository: UsersRepository,
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow('AWS_S3_BUCKET');
  }

  async generatePresignedUrl(userId: string, dto: ProfileImagePresignedUrlDto) {
    const key = `profile-images/${userId}/${ulid()}/${dto.fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });
    const presignedUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });
    return { presignedUrl, key };
  }

  private isS3Key(value: string): boolean {
    return value.startsWith('profile-images/');
  }

  private async getViewUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: 86400 });
  }

  async getMe(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    if (user.profileImageUrl && this.isS3Key(user.profileImageUrl)) {
      return { ...user, profileImageUrl: await this.getViewUrl(user.profileImageUrl) };
    }
    return user;
  }

  async updateMe(userId: string, data: UpdateUserDto) {
    const updated = await this.repository.updateUser(userId, data);
    if (!updated) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    if (updated.profileImageUrl && this.isS3Key(updated.profileImageUrl)) {
      return { ...updated, profileImageUrl: await this.getViewUrl(updated.profileImageUrl) };
    }
    return updated;
  }

  async deleteMe(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    await this.repository.softDeleteUser(userId);
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
      return { ...user, profileImageUrl: await this.getViewUrl(user.profileImageUrl) };
    }
    return user;
  }
}
