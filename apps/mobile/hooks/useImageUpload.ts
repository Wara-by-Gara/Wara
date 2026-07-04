// 이미지 업로드 파이프라인 훅 — 사진 앨범/채팅 첨부 공용.
// 선택(권한 요청) → 다운스케일·JPEG 압축 → presigned URL → S3 raw PUT → 등록(register).
// presigned/register 함수를 주입받아 도메인(사진/메시지)에 재사용한다.

import { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { WaraApiError, WaraNetworkError } from '@/api';

/** register 콜백에 전달되는 업로드 결과 메타. */
export type UploadedImageMeta = {
  imageKey: string;
  fileSize: number;
  takenAt?: string;
  exifMetadata?: {
    gps_lat?: number;
    gps_lng?: number;
    make?: string;
    model?: string;
  };
};

export type ImageUploadConfig<T> = {
  /** presigned URL 발급 (도메인별). (fileName, contentType) → { presignedUrl, key } */
  getPresignedUrl: (
    fileName: string,
    contentType: string,
  ) => Promise<{ presignedUrl: string; key: string }>;
  /** 업로드 완료 등록 — 사진=registerPhoto, 채팅=sendImageMessage. */
  register: (meta: UploadedImageMeta) => Promise<T>;
};

const MAX_EDGE = 2000; // 긴 변 최대 px
const COMPRESS = 0.8; // JPEG 압축률(1=무손실)
const CONTENT_TYPE = 'image/jpeg'; // manipulate 결과를 항상 JPEG로 통일

type Progress = { completed: number; total: number };

export function useImageUpload<T>(config: ImageUploadConfig<T>) {
  // config는 렌더마다 새로 만들어질 수 있어 ref로 최신값만 참조(콜백 안정화).
  const configRef = useRef(config);
  configRef.current = config;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => setError(null), []);

  const pickAndUpload = useCallback(
    async (
      opts: { allowsMultipleSelection?: boolean; quality?: number } = {},
    ): Promise<T[]> => {
      setError(null);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('사진 접근 권한이 필요해요. 설정에서 허용해주세요.');
        return [];
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: opts.allowsMultipleSelection ?? false,
        quality: opts.quality ?? 1,
        exif: true,
      });
      if (picked.canceled) return [];

      const assets = picked.assets;
      setUploading(true);
      setProgress({ completed: 0, total: assets.length });

      const results: T[] = [];
      let failed = 0;
      try {
        for (const asset of assets) {
          try {
            const meta = await uploadOne(asset, configRef.current.getPresignedUrl);
            results.push(await configRef.current.register(meta));
          } catch (err) {
            failed += 1;
            setError(uploadErrorMessage(err));
          } finally {
            setProgress((prev) =>
              prev ? { completed: prev.completed + 1, total: prev.total } : prev,
            );
          }
        }
      } finally {
        setUploading(false);
        setProgress(null);
      }

      // 부분 성공은 그대로 반환하되, 실패가 하나도 없으면 에러 상태를 비운다.
      if (failed === 0) setError(null);
      return results;
    },
    [],
  );

  return { pickAndUpload, uploading, progress, error, reset };
}

/** 단일 asset: 다운스케일 → Blob → presigned → S3 PUT → 메타 반환. */
async function uploadOne(
  asset: ImagePicker.ImagePickerAsset,
  getPresignedUrl: (
    fileName: string,
    contentType: string,
  ) => Promise<{ presignedUrl: string; key: string }>,
): Promise<UploadedImageMeta> {
  const resized = await downscale(asset);
  const blob = await uriToBlob(resized.uri);

  const fileName = `photo-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
  const { presignedUrl, key } = await getPresignedUrl(fileName, CONTENT_TYPE);

  // ⚠️ S3 raw PUT 예외 — presignedUrl은 WARA API가 아니라 S3 URL이므로 apiFetch(인증/envelope)를
  // 쓰지 않고 fetch로 직접 PUT 한다. 이 파일에서 유일하게 apiFetch를 우회하는 지점.
  const putRes = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': CONTENT_TYPE },
    body: blob,
  });
  if (!putRes.ok) {
    throw new WaraNetworkError(`S3 업로드 실패 (status ${putRes.status})`);
  }

  const exif = parseExif(asset.exif);
  const hasExifMeta =
    exif.gps_lat !== undefined || exif.make !== undefined || exif.model !== undefined;

  return {
    imageKey: key,
    fileSize: blob.size,
    takenAt: exif.takenAt,
    exifMetadata: hasExifMeta
      ? { gps_lat: exif.gps_lat, gps_lng: exif.gps_lng, make: exif.make, model: exif.model }
      : undefined,
  };
}

/** 긴 변을 MAX_EDGE 이하로 리사이즈하고 JPEG로 재인코딩. */
async function downscale(asset: ImagePicker.ImagePickerAsset) {
  const context = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);
  if (longest > MAX_EDGE) {
    if (asset.width >= asset.height) context.resize({ width: MAX_EDGE });
    else context.resize({ height: MAX_EDGE });
  }
  const image = await context.renderAsync();
  return image.saveAsync({ compress: COMPRESS, format: SaveFormat.JPEG });
}

/** 로컬 파일 URI → Blob (fileSize 계산 + PUT body 겸용). */
async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}

type ParsedExif = {
  takenAt?: string;
  gps_lat?: number;
  gps_lng?: number;
  make?: string;
  model?: string;
};

/** picker asset.exif에서 촬영시각·GPS·기기 추출. 키/부호는 iOS EXIF 규칙 기준. */
function parseExif(exif: Record<string, unknown> | null | undefined): ParsedExif {
  if (!exif) return {};
  const out: ParsedExif = {};

  const dateTime = exif.DateTimeOriginal ?? exif.DateTime;
  if (typeof dateTime === 'string') {
    const iso = exifDateToIso(dateTime);
    if (iso) out.takenAt = iso;
  }

  const lat = toFiniteNumber(exif.GPSLatitude);
  const lng = toFiniteNumber(exif.GPSLongitude);
  if (lat !== null && lng !== null) {
    const latRef = typeof exif.GPSLatitudeRef === 'string' ? exif.GPSLatitudeRef : 'N';
    const lngRef = typeof exif.GPSLongitudeRef === 'string' ? exif.GPSLongitudeRef : 'E';
    out.gps_lat = latRef.toUpperCase() === 'S' ? -Math.abs(lat) : Math.abs(lat);
    out.gps_lng = lngRef.toUpperCase() === 'W' ? -Math.abs(lng) : Math.abs(lng);
  }

  if (typeof exif.Make === 'string') out.make = exif.Make;
  if (typeof exif.Model === 'string') out.model = exif.Model;
  return out;
}

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** EXIF "YYYY:MM:DD HH:MM:SS"(타임존 없음, 기기 로컬로 해석) → ISO 문자열. */
function exifDateToIso(value: string): string | null {
  const m = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(se),
  );
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** WaraApiError.code → 한국어 업로드 실패 메시지. */
function uploadErrorMessage(err: unknown): string {
  if (err instanceof WaraApiError) {
    switch (err.code) {
      case 'PHOTO_INVALID_MIME':
      case 'MESSAGE_IMAGE_INVALID':
        return '지원하지 않는 이미지 형식이에요';
      case 'PHOTO_TOO_LARGE':
        return '이미지 용량이 너무 커요 (최대 10MB)';
      case 'PHOTO_DUPLICATE':
        return '이미 올린 사진이에요';
      case 'PARTICIPANT_NOT_FOUND':
        return '이 모임의 참가자만 올릴 수 있어요';
      case 'CONVERSATION_FORBIDDEN':
        return '이 대화방에 접근할 수 없어요';
      case 'INVITATION_CLOSED':
        return '마감된 모임이에요';
    }
  }
  if (err instanceof WaraNetworkError) return '네트워크 상태를 확인해주세요';
  return '업로드에 실패했어요';
}
