# 사진 위치 지도 표시 기능 계획

> 이슈 #129
> 상태: 구현 대기 (UX 방향 미정)

---

## 목적

사진 업로드 시 EXIF GPS 데이터를 추출·저장하고, 지도 위에 사진 핀으로 표시한다.
"어디서 찍었는지"를 지도로 한눈에 파악할 수 있게 해 추억의 공간감을 제공한다.

---

## 현황

### 이미 있는 것

- `photos.exifMetadata` (jsonb) — `gps_lat`, `gps_lng`, `gps_address` 필드 정의됨
- `UploadPhotoSchema` — `exifMetadata` 수신 가능하도록 이미 정의됨
- `KakaoMap` 컴포넌트 + 지도 페이지 (`/invitations/:id/location`)

### 없는 것

1. 프론트 업로드 시 EXIF GPS를 추출해서 실제로 서버에 보내는 코드
   - `Album.tsx`가 현재 `imageKey`만 보냄, `exifMetadata` 미전달
2. GPS 있는 사진만 모아 반환하는 API 엔드포인트
3. 지도에 사진 핀을 렌더링하는 UI (UX 미정)

---

## 구현 단계

### Step 1 — 프론트: 업로드 시 EXIF GPS 추출

**변경 파일**
- `apps/web/src/domain/InvitationDetail/PhotoWithFeedback/Album/Album.tsx`
- `apps/web/src/lib/api/photos.ts`

**작업 내용**

1. `exifr` 패키지 설치
   ```
   pnpm add exifr -F @wara/web
   ```

2. `Album.tsx`의 `handleUpload` 내부에서 S3 업로드 전 EXIF 파싱
   ```ts
   import exifr from 'exifr';
   const gps = await exifr.gps(file).catch(() => null);
   // gps: { latitude, longitude } | null
   ```

3. `registerPhoto` 호출 시 `takenAt`, `exifMetadata` 함께 전송
   ```ts
   await registerPhoto(invitationId, key, {
     takenAt: exifData?.DateTimeOriginal?.toISOString(),
     exifMetadata: gps ? { gps_lat: gps.latitude, gps_lng: gps.longitude } : undefined,
   });
   ```

4. `lib/api/photos.ts`의 `registerPhoto` 함수 시그니처 확장
   ```ts
   export function registerPhoto(
     invitationId: string,
     imageKey: string,
     meta?: { takenAt?: string; exifMetadata?: { gps_lat: number; gps_lng: number } },
   ): Promise<Photo>
   ```

---

### Step 2 — 백엔드: 사진 위치 목록 API

**변경 파일**
- `apps/api/src/photos/photos.repository.ts`
- `apps/api/src/photos/photos.service.ts`
- `apps/api/src/photos/photos.controller.ts`

**새 엔드포인트**
```
GET /invitations/:invitationId/photos/locations
```

**응답 형태**
```json
[
  {
    "id": "...",
    "url": "https://...",
    "gps_lat": 37.1234,
    "gps_lng": 127.5678,
    "takenAt": "2025-05-30T10:00:00Z"
  }
]
```

**구현 요점**
- Repository: `exifMetadata->>'gps_lat' IS NOT NULL` 조건으로 GPS 있는 사진만 조회
- Service: `imageKey`를 presigned URL로 변환 후 반환
- Controller: 기존 `JwtAuthGuard` + `BlocklistGuard` + `ParticipantGuard` 동일하게 적용
- 페이지네이션 없음 (핀 표시 용도, 수가 과도해지면 추후 검토)
- 기존 컨트롤러에서 `/photos/:id` 앞에 위치시켜야 라우팅 충돌 없음

**에러 코드:** 신규 추가 없음 (기존 `PHOTO_NOT_FOUND`, `PARTICIPANT_NOT_FOUND` 재사용)

---

### Step 3 — 프론트: API 레이어 + 훅

**변경 파일**
- `apps/web/src/lib/api/photos.ts`

```ts
export interface PhotoLocation {
  id: string;
  url: string;
  gps_lat: number;
  gps_lng: number;
  takenAt: string | null;
}

export function getPhotoLocations(invitationId: string): Promise<PhotoLocation[]> {
  return apiGet<PhotoLocation[]>(`/invitations/${invitationId}/photos/locations`);
}
```

---

### Step 4 — 지도 UI 연결 (UX 미정)

**핀 탭 동작:** `PhotoDetailModal` 열기 (결정 완료)

**표시 위치 옵션 (셋 중 하나 선택 필요)**

| 옵션 | 설명 | 트레이드오프 |
|---|---|---|
| **A. 기존 지도 페이지 토글** | `/location` 페이지에 "사진 보기" 버튼 추가, 참가자 핀과 전환 or 동시 표시 | 구현 단순, 참가자 핀과 혼재될 수 있음 |
| **B. 앨범 모달 내 지도 탭** | `AlbumModal`에 지도 탭 추가, GPS 있는 사진만 핀으로 표시 | 앨범 흐름과 자연스럽게 연결, 별도 지도 로직 필요 |
| **C. 별도 사진 지도 페이지** | `/invitations/:id/photos/map` 신규 라우트 | 가장 독립적, 진입점(딥링크) 별도 필요 |

**KakaoMap 공통 확장 (A·C 경우)**
- `photoMarkers?: Array<{ id: string; lat: number; lng: number; url: string }>` prop 추가
- `onPhotoMarkerClick?: (photoId: string) => void` prop 추가
- 마커 아이콘: 카메라 아이콘 또는 사진 썸네일 (디자인 확인 필요)

---

## 의존성

- `exifr` 패키지 설치 필요 (Step 1)
- DB 마이그레이션 불필요 (스키마 변경 없음)
- Kakao Maps SDK 추가 로드 없음

## 구현 순서

Step 1 → Step 2 → Step 3 → Step 4 (UX 결정 후)

Step 1~3은 UX와 무관하게 선행 가능.
