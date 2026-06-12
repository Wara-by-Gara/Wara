// 업로드 허용 MIME (apps/api/src/photos/CLAUDE.md 정합)
// jpeg/png/webp + iOS 기본 포맷 heic/heif. GIF는 EXIF 없어 제외.
export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

export const MAX_IMAGE_BYTES = 30 * 1024 * 1024; // 30MB
export const SNIFF_RANGE_BYTES = 4_100; // file-type minimumBytes 권장값
export const THUMBNAIL_MAX_DIMENSION = 400; // 장변 px
