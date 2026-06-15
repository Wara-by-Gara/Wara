# 09. 사진 앨범

> 사진은 단순해 보이지만 S3·매직넘버 검증·중복 감지·EXIF·썸네일·좋아요까지 묶여 있다.

---

## 1. 도메인 한눈에

```
participants  ──────┐
                    │
                    ▼
                  photos          (S3 imageKey, takenAt, exifFingerprint)
                  /    \
       photo_likes     photo_feedbacks
       (좋아요)         (코멘트)
```

`apps/api/src/database/schema/photos.ts:7`:
```ts
export const photos = pgTable('photos', {
  id:             text('id').primaryKey().$defaultFn(() => ulid()),
  participantId:  text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  invitationId:   text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  imageKey:       text('image_key').notNull(),         // S3 key
  thumbnailKey:   text('thumbnail_key'),
  takenAt:        timestamp('taken_at', { withTimezone: true }),
  exifMetadata:   jsonb('exif_metadata'),
  viewCount:      integer('view_count').notNull().default(0),
  likeCount:      integer('like_count').notNull().default(0),
  feedbackCount:  integer('feedback_count').notNull().default(0),
  createdAt: ..., updatedAt: ..., deletedAt: ...,
  exifFingerprint: text('exif_fingerprint'),
}, (t) => [
  check('check_photo_view_count', sql`${t.viewCount} >= 0`),
  index('idx_photos_invitation_taken_at').on(t.invitationId, t.takenAt),
  index('idx_photos_deleted_at').on(t.deletedAt),
  uniqueIndex('uq_photos_invitation_fingerprint')
    .on(t.invitationId, t.exifFingerprint)
    .where(isNull(t.deletedAt)),    // ← partial index
]);
```

---

## 2. 업로드 플로우

```
[1] 클라이언트 → POST /photos/upload-url (S3 presigned URL 요청)
[2] 서버    → presigned PUT URL 반환
[3] 클라이언트 → PUT 직접 S3로 업로드
[4] 클라이언트 → POST /photos { imageKey, exif... } (업로드 완료 통지)
[5] 서버
     ├─ S3에서 객체 head → MIME, size 확인
     ├─ 매직넘버 sniff (file-type 라이브러리)
     │   허용: image/jpeg, image/png, image/webp, image/heic, image/heif
     ├─ size > 10MB → PHOTO_TOO_LARGE (413) + S3 객체 삭제
     ├─ MIME 불일치 → PHOTO_INVALID_MIME (400) + S3 객체 삭제
     ├─ exifFingerprint 중복 검사 → 일치하면 PHOTO_DUPLICATE (409)
     ├─ 썸네일 잡 큐 push (image-processing-jobs)
     └─ photos row INSERT
[6] 워커 → 썸네일 생성 → thumbnailKey 업데이트
```

### 왜 presigned URL인가
- 파일이 백엔드를 통과 안 함 → 백엔드 트래픽 절약
- 백엔드 CPU·메모리 안 씀

### 매직넘버 sniff
파일 확장자나 Content-Type은 위조 가능. **파일 시작부 바이너리**를 보고 진짜 타입 확인.
- `file-type` 라이브러리가 그 역할
- JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, ...

---

## 3. 중복 감지 — exifFingerprint

같은 사진을 두 번 올리면 앨범이 지저분해짐. 자동 차단.

### Fingerprint 구성
- `takenAt + 기기 정보 + GPS + 파일 크기` 등을 해시
- EXIF가 없는 사진(예: 캡처)은 fingerprint도 null → 중복 검사 안 함

### partial unique index
```ts
uniqueIndex('uq_photos_invitation_fingerprint')
  .on(t.invitationId, t.exifFingerprint)
  .where(isNull(t.deletedAt))
```
- soft delete된 row는 제외 → 삭제 후 재업로드 가능
- 같은 초대장 안에서만 unique (다른 초대장엔 같은 사진 올릴 수 있음)

---

## 4. EXIF 처리

### 클라이언트(`apps/web`)
- `exifr` 라이브러리로 EXIF 파싱
- 업로드 전에 잘못된 EXIF (회전 등) 정리

### 서버
- `exifMetadata: jsonb` 컬럼에 원본 EXIF 저장
- `takenAt`은 EXIF의 DateTimeOriginal 추출
- 추후 분석(어디서·언제 촬영)에 활용

---

## 5. 썸네일 — BullMQ 큐

큰 이미지 변환을 동기로 하면 응답이 느려짐. → 큐로 분리.

```
photos INSERT 직후 → image-processing-jobs 큐에 push
워커 (apps/api/src/image-processing/)
  ├─ S3에서 원본 다운로드
  ├─ sharp로 리사이즈 (480px)
  ├─ S3에 thumbnailKey로 PUT
  └─ photos.thumbnailKey UPDATE
```

### 왜 sharp인가
- libvips 기반, 순수 JS보다 압도적으로 빠름
- 매번 새 프로세스 없이 동작

---

## 6. 비정규화 카운트 — likeCount, feedbackCount

```ts
viewCount:     integer('view_count').notNull().default(0),
likeCount:     integer('like_count').notNull().default(0),
feedbackCount: integer('feedback_count').notNull().default(0),
```

### 왜 카운트를 직접 저장?
- 목록 페이지에서 매 사진마다 `COUNT(*)`는 비용
- 카운트만 따로 칼럼에 두면 SELECT 한 번에 다 끝

### 동기화 위험
- 좋아요 + 1 / -1 시 photos.likeCount도 갱신 필요
- 트랜잭션으로 묶거나, 데이터 깨질 위험 감수 (실시간이라 정확도 약간 손해 봐도 OK)

---

## 7. photo_likes

```ts
export const photoLikes = pgTable('photo_likes', {
  id:            ...,
  photoId:       text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  createdAt:     timestamp(...).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_photo_likes_photo_participant').on(t.photoId, t.participantId),
]);
```

- unique constraint로 중복 좋아요 차단
- 이미 좋아요 → `PHOTO_LIKE_ALREADY_EXISTS`
- 없는데 취소 → `PHOTO_LIKE_NOT_FOUND`
- **participant 단위** (user 아님) — 같은 user가 다른 초대장에선 각각 좋아요 가능

---

## 8. 리마인드 앨범 (베스트 9)

모임 종료 후 자동 생성. 알고리즘 개요:
- 좋아요 수 + 피드백 수 + viewCount 가중치 점수
- 상위 9장 선정
- 호스트가 "리마인드 보내기" 클릭하면 게스트들에게 알림

(현재 알고리즘 디테일은 코드 참조)

---

## 9. 사진 지도

`event_locations` 좌표를 중심으로 `photos.exifMetadata`에서 GPS 추출 → 지도에 핀.
GPS 없는 사진은 지도에 표시 안 함.

→ Kakao Map은 프론트 `apps/web/src/components/map/`에서 (todo의 "NEXT_PUBLIC_KAKAO_MAP_APP_KEY 직접 입력 필요" 메모와 연결).

---

## 10. 흔한 함정

### S3 객체와 DB의 불일치
- DB INSERT 실패 → S3엔 파일이 남음 (orphan)
- DB row 삭제 → S3엔 파일이 남음

→ 해결: 실패 시 S3 객체 즉시 삭제, 정기 cleanup 잡 (아직 미구현).

### Race condition — 동시 업로드 같은 파일
- 두 클라이언트가 동시에 같은 EXIF 사진 업로드
- 둘 다 fingerprint 검사 통과 → 둘 다 INSERT → unique violation
- → 두 번째 요청만 `PHOTO_DUPLICATE` 에러 (정상 동작)

### 썸네일이 안 보임
- 큐 워커가 멎었거나 sharp 실행 실패
- 대안: 원본 이미지로 fallback 렌더 또는 placeholder

---

## 11. 체크리스트

- [ ] presigned URL 업로드 플로우 (5단계)를 그릴 수 있다
- [ ] 매직넘버 sniff가 왜 필요한지 안다
- [ ] exifFingerprint + partial unique index의 의미를 안다
- [ ] 썸네일 큐가 BullMQ로 분리된 이유를 안다
- [ ] photo_likes가 user가 아닌 participant 단위인 이유를 안다

→ 다음: [10. AI 이미지 합성](./10-ai-generation.md)
