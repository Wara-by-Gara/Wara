/**
 * 사진 업로드 요청 시나리오
 *
 * 테스트 대상:
 *   - GET  /invitations/:invitationId/photos              (사진 목록 조회)
 *   - POST /invitations/:invitationId/photos/presigned-url (업로드 URL 발급)
 *   - POST /invitations/:invitationId/photos              (업로드 완료 후 DB 저장)
 *
 * 시나리오:
 *   20명이 동시에 사진 업로드 요청을 수행한다.
 *   실제 S3 업로드는 K6에서 수행하지 않고,
 *   presigned-url 발급 → 업로드 완료 신호(DB 저장) 흐름을 검증한다.
 *
 * 실행:
 *   k6 run \
 *     -e BASE_URL=http://localhost:3001 \
 *     -e INVITATION_ID=01XXXXXXXXXXXXXXXXXXXXXXXXX \
 *     -e ACCESS_TOKEN=your_jwt_token \
 *     k6/scenarios/photos.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { getTokenForVu, authHeaders } from '../helpers/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const INVITATION_ID = __ENV.INVITATION_ID || '01JVXXXXXXXXXXXXXXXXXXXXXXXXX';

// 커스텀 메트릭
const photoListDuration = new Trend('photo_list_duration', true);
const presignedUrlDuration = new Trend('presigned_url_duration', true);
const uploadRecordDuration = new Trend('upload_record_duration', true);
const errorRate = new Rate('photos_errors');

// 허용된 contentType 목록 (presigned-url DTO 기준)
const CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

// 가상의 imageKey — 실제 S3 업로드 없이 DB 저장만 검증
// 실제 테스트 시에는 presigned URL로 S3 업로드 후 받은 key를 사용해야 한다
function makeImageKey(vuId, iter) {
  return `photos/test-vu${vuId}-iter${iter}/photo_${Date.now()}.jpg`;
}

export const options = {
  scenarios: {
    // 20명이 동시에 사진 업로드 요청
    concurrent_photo_upload: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
    },
  },
  thresholds: {
    // 사진 목록 조회: 500ms 이내
    photo_list_duration: ['p(95)<500'],
    // presigned-url 발급: 300ms 이내 (S3 서명만 수행)
    presigned_url_duration: ['p(95)<300'],
    // 업로드 완료 DB 저장: 500ms 이내
    upload_record_duration: ['p(95)<500'],
    // 에러율 1% 미만
    photos_errors: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const token = getTokenForVu(__VU);
  const headers = authHeaders(token);

  // --- 1단계: 사진 목록 조회 ---
  const listRes = http.get(
    `${BASE_URL}/invitations/${INVITATION_ID}/photos`,
    { headers, tags: { name: 'GET /invitations/:id/photos' } },
  );

  photoListDuration.add(listRes.timings.duration);

  const listOk = check(listRes, {
    'photo list: status 200': (r) => r.status === 200,
    'photo list: has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined || Array.isArray(body) || Array.isArray(body.photos);
      } catch {
        return false;
      }
    },
  });

  if (!listOk) {
    errorRate.add(1);
    console.error(`사진 목록 조회 실패 [VU ${__VU}]: ${listRes.status}`);
  } else {
    errorRate.add(0);
  }

  // 사용자가 업로드를 준비하는 시간 모사
  sleep(0.5 + Math.random() * 0.5);

  // --- 2단계: presigned URL 발급 ---
  const contentType = CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)];
  const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
  const fileName = `photo_vu${__VU}_${Date.now()}.${ext}`;

  const presignedRes = http.post(
    `${BASE_URL}/invitations/${INVITATION_ID}/photos/presigned-url`,
    JSON.stringify({ fileName, contentType }),
    { headers, tags: { name: 'POST /invitations/:id/photos/presigned-url' } },
  );

  presignedUrlDuration.add(presignedRes.timings.duration);

  let imageKey = null;
  const presignedOk = check(presignedRes, {
    'presigned-url: status 201': (r) => r.status === 201,
    'presigned-url: has url': (r) => {
      try {
        const body = JSON.parse(r.body);
        // presigned URL과 S3 key를 응답에서 추출
        const url = body.data?.url ?? body.url ?? body.presignedUrl;
        imageKey = body.data?.key ?? body.key ?? body.imageKey;
        return typeof url === 'string' && url.length > 0;
      } catch {
        return false;
      }
    },
  });

  if (!presignedOk) {
    errorRate.add(1);
    console.error(`presigned URL 발급 실패 [VU ${__VU}]: ${presignedRes.status}`);
    sleep(1);
    return;
  } else {
    errorRate.add(0);
  }

  // S3 업로드 시간 모사 (실제 업로드는 K6 외부에서 발생)
  sleep(0.5 + Math.random() * 1);

  // --- 3단계: 업로드 완료 후 DB 저장 ---
  // imageKey를 presigned-url 응답에서 받지 못한 경우 폴백 key 사용
  const uploadImageKey = imageKey || makeImageKey(__VU, __ITER);

  // 촬영 시간 — 실제 EXIF에서 추출한 값 모사
  const takenAt = new Date(
    Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
  ).toISOString();

  const uploadBody = JSON.stringify({
    imageKey: uploadImageKey,
    takenAt,
    // GPS 정보는 선택 사항 — 일부 VU에서만 포함
    ...(Math.random() > 0.7
      ? {
          exifMetadata: {
            gps_lat: 37.5665 + (Math.random() - 0.5) * 0.1,
            gps_lng: 126.978 + (Math.random() - 0.5) * 0.1,
            gps_address: null,
          },
        }
      : {}),
  });

  const uploadRes = http.post(
    `${BASE_URL}/invitations/${INVITATION_ID}/photos`,
    uploadBody,
    { headers, tags: { name: 'POST /invitations/:id/photos' } },
  );

  uploadRecordDuration.add(uploadRes.timings.duration);

  const uploadOk = check(uploadRes, {
    'upload record: status 201': (r) => r.status === 201,
    'upload record: has photoId': (r) => {
      try {
        const body = JSON.parse(r.body);
        const id = body.data?.id ?? body.id ?? body.photoId;
        return typeof id === 'string' && id.length > 0;
      } catch {
        return false;
      }
    },
  });

  if (!uploadOk) {
    errorRate.add(1);
    console.error(`사진 업로드 DB 저장 실패 [VU ${__VU}]: ${uploadRes.status} ${uploadRes.body}`);
  } else {
    errorRate.add(0);
  }

  // 다음 iteration 전 대기 (2~4초)
  sleep(2 + Math.random() * 2);
}
