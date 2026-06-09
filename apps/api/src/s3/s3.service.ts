// s3.service.ts
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isDicebearProfileImage } from '../common/utils/profile-image';
import { isTemplateImagePath, resolveStaticAssetUrl } from '../common/utils/static-asset-url';
import { S3_CLIENT } from './s3.constants';

const UPLOAD_URL_EXPIRES_IN = 900;
const GET_URL_EXPIRES_IN = 86400;

@Injectable()
export class S3Service {
  private readonly bucket: string;
  private readonly region: string;

  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow('AWS_S3_BUCKET');
    this.region = this.config.getOrThrow('AWS_REGION');
  }

  private isExternalUrl(key: string): boolean {
    return key.startsWith('http://') || key.startsWith('https://');
  }

  // public 파일 고정 URL (만료 없음)
  getPublicUrl(key: string): string {
    if (isTemplateImagePath(key)) return resolveStaticAssetUrl(key);
    if (this.isExternalUrl(key)) return key;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  // 업로드용 presigned URL (PUT)
  async getUploadPresignedUrl(key: string, contentType: string): Promise<{ presignedUrl: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const presignedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: UPLOAD_URL_EXPIRES_IN,
    });
    return { presignedUrl, key };
  }

  // 조회용 presigned URL (GET, private 파일용)
  async getViewPresignedUrl(key: string): Promise<string> {
    if (this.isExternalUrl(key)) return key;
    if (isDicebearProfileImage(key)) return key;
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: GET_URL_EXPIRES_IN });
  }

  // 다운로드용 presigned URL (GET + Content-Disposition)
  async getDownloadPresignedUrl(key: string, fileName: string): Promise<string> {
    const encodedFileName = encodeURIComponent(fileName);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodedFileName}`,
    });
    return getSignedUrl(this.s3, command, { expiresIn: GET_URL_EXPIRES_IN });
  }
}