import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { ErrorCode } from '../common/constants/error-codes';
import { S3Service } from '../s3/s3.service';
import {
  ALLOWED_IMAGE_MIMES,
  AllowedImageMime,
  MAX_IMAGE_BYTES,
  SNIFF_RANGE_BYTES,
  THUMBNAIL_MAX_DIMENSION,
} from './image-processing.constants';

export interface SniffResult {
  mime: AllowedImageMime;
  contentLength: number;
}

@Injectable()
export class ImageProcessingService {
  constructor(private readonly s3: S3Service) {}

  // S3에 업로드된 원본의 크기 + 매직 넘버 sniff. 검증 실패 시 S3 객체를 즉시 정리하고 도메인 에러 throw.
  async verifyUpload(key: string): Promise<SniffResult> {
    const { contentLength } = await this.s3.headObject(key);

    if (contentLength > MAX_IMAGE_BYTES) {
      await this.s3.deleteObject(key).catch(() => undefined);
      throw new PayloadTooLargeException(ErrorCode.PHOTO_TOO_LARGE);
    }

    const head = await this.s3.getObjectRange(key, SNIFF_RANGE_BYTES);
    const sniffed = await fileTypeFromBuffer(head);
    const mime = sniffed?.mime;

    if (!mime || !isAllowedMime(mime)) {
      await this.s3.deleteObject(key).catch(() => undefined);
      throw new BadRequestException(ErrorCode.PHOTO_INVALID_MIME);
    }

    return { mime, contentLength };
  }

  // 원본 다운로드 → Sharp 400px 섬네일 → JPEG로 통일 업로드.
  // (heic 원본도 표시용 섬네일은 jpg가 호환성 최선. 포맷 유지 정책은 원본에만 적용)
  async generateThumbnail(sourceKey: string, thumbnailKey: string): Promise<void> {
    const buf = await this.s3.getObjectBuffer(sourceKey);
    const out = await sharp(buf)
      .rotate() // EXIF orientation 자동 적용
      .resize({
        width: THUMBNAIL_MAX_DIMENSION,
        height: THUMBNAIL_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    await this.s3.putObjectBuffer(thumbnailKey, out, 'image/jpeg');
  }
}

function isAllowedMime(mime: string): mime is AllowedImageMime {
  return (ALLOWED_IMAGE_MIMES as readonly string[]).includes(mime);
}
