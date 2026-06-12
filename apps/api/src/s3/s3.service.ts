// s3.service.ts
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
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

  // 메타데이터(크기/contentType) 확인용. 업로드 직후 검증에 사용.
  async headObject(key: string): Promise<{ contentLength: number; contentType?: string }> {
    const out = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    return {
      contentLength: out.ContentLength ?? 0,
      contentType: out.ContentType,
    };
  }

  // 첫 N바이트만 가져와 매직 넘버 sniff용. 전체 다운로드 비용 절약.
  async getObjectRange(key: string, end: number): Promise<Buffer> {
    const out = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: `bytes=0-${end}` }),
    );
    return streamToBuffer(out.Body as Readable);
  }

  // 워커가 원본 전체를 받아 Sharp로 변환할 때 사용.
  async getObjectBuffer(key: string): Promise<Buffer> {
    const out = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return streamToBuffer(out.Body as Readable);
  }

  // 워커가 생성한 섬네일을 S3에 업로드.
  async putObjectBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
  }

  // 검증 실패한 업로드 객체 즉시 정리. (DB에 등록되기 전 단계)
  async deleteObject(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}