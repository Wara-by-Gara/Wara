# 10. AI 이미지 합성

> "사용자 셀카 + 템플릿 배경"을 OpenAI로 합성해 초대장 메인 이미지로. 외부 API, 한도, 락을 한꺼번에 다룬다.

---

## 1. 무슨 기능인가

호스트가 초대장을 만들 때:
1. 자기 사진 업로드 (셀카 등)
2. 템플릿 선택 (생일·결혼·송년회 등 디자인)
3. AI가 두 이미지를 합성 → 인물이 그 배경에 자연스럽게 들어감
4. 결과를 다운로드 또는 그대로 메인 커버로 사용

### 왜 OpenAI인가
- DALL-E 합성 API (gpt-image-1)로 두 이미지를 받아 합성
- 별도 모델 학습 X, API 호출만으로 가능
- 비용·속도 트레이드오프 OK

---

## 2. 도메인 — 두 개의 테이블

### `ai_image_jobs`
초대장 만들기 흐름 안에서 합성 → **결과를 invitation의 메인 이미지로 자동 적용**.

### `ai_generations` (`schema/ai-generations.ts:12`)
초대장 만들기 페이지에서 따로 합성을 시험 → **결과는 다운로드 URL로만 제공**, invitation 미생성.

```ts
export const aiGenerations = pgTable('ai_generations', {
  id:              text('id').primaryKey().$defaultFn(() => ulid()),
  userId:          text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  templateId:      text('template_id').notNull(),
  sourceImageKey:  text('source_image_key').notNull(),
  // 임시 S3 키. TTL 1시간 후 만료. 만료 후에도 status는 completed 유지.
  resultImageKey:  text('result_image_key'),
  status:          varchar('status', { length: 20 }).notNull().default('pending'),
  errorCode:       text('error_code'),
  createdAt:       ...,
  updatedAt:       ...,
  completedAt:     ...,
}, (t) => [
  index('idx_ai_generations_user_created').on(t.userId, t.createdAt),
  index('idx_ai_generations_status').on(t.status),
]);
```

### 일일 한도는 두 테이블 합산
- `AI_DAILY_LIMIT=3`
- 한 user가 24시간 동안 합산 3회 까지
- 초과 → `AI_DAILY_LIMIT_EXCEEDED` (429)

---

## 3. 흐름

```
[1] 클라이언트 → POST /ai/generations
                 { templateId, sourceImageKey }
[2] 서버
     ├─ 일일 한도 체크 (user 단위, 24h 카운트)
     ├─ 서킷 브레이커 상태 체크 → open이면 AI_SERVICE_UNAVAILABLE (503)
     ├─ aiGenerations INSERT (status='pending')
     └─ 큐에 잡 푸시 (또는 동기 호출)
[3] 워커
     ├─ 템플릿 이미지 + 사용자 이미지 가져옴
     ├─ OpenAI API 호출
     │   ├─ timeout 60s
     │   ├─ 실패 → AI_PROCESSING_FAILED, status='failed'
     │   └─ timeout → AI_TIMEOUT (504)
     ├─ 결과를 S3에 임시 저장 (1h lifecycle)
     └─ aiGenerations UPDATE (status='completed', resultImageKey, completedAt)
[4] 클라이언트 → GET /ai/generations/:id
                 polling 또는 WebSocket으로 상태 확인
                 status='completed'면 다운로드 URL 반환
```

---

## 4. 일일 한도 — race condition

### 단순 구현 (위험)
```ts
const todayCount = await countToday(userId);
if (todayCount >= 3) throw DAILY_LIMIT_EXCEEDED;
await insert({ userId, ... });  // ← 이 사이 다른 요청이 INSERT하면 4회 가능
```

### 보강안 (todo 보류)
- 트랜잭션 + SELECT FOR UPDATE
- 또는 일일 카운트 row를 따로 두고 unique 제약
- PR #239의 race 테스트가 이 보강 후 기대값 수정 대상

---

## 5. 서킷 브레이커

OpenAI 장애·과부하 시 백엔드도 같이 죽지 않게 보호.

### 패턴
- 최근 N분 실패율이 임계치 초과 → 회로 **open**
- open 상태에선 새 요청 즉시 거절 (`AI_SERVICE_UNAVAILABLE` 503)
- 일정 시간 후 **half-open** → 일부만 시험적으로 통과
- 통과하면 **closed** (정상) 복귀

### 왜 필요?
- OpenAI가 느려지면 우리 worker가 다 점유 → 다른 큐 잡도 밀림
- 즉시 거절로 자원 보호

---

## 6. S3 lifecycle (1시간 만료)

### 의도
- AI 결과는 **다운로드만 하면 끝** — 영구 보관 불필요
- S3에 lifecycle rule로 `ai-generations/results/` prefix 객체를 1시간 후 자동 삭제

### 현재 상태
- todo에 "AWS 콘솔에서 lifecycle rule 적용 필요" 보류 항목으로 남아 있음

### 만료 후 동작
- `resultImageKey`는 DB에 남아 있지만 S3 객체는 없음
- 클라이언트가 다운로드 시도 시 S3가 404 → 응답 처리 필요

---

## 7. 낙관적 락 — invitation 메인 이미지 적용

`ai_image_jobs` (invitation에 자동 적용하는 쪽)이 끝나면:
```ts
UPDATE invitations
SET main_image_key = ?,
    updated_at = NOW()
WHERE id = ?
  AND updated_at = ?   -- ← expectedUpdatedAt
```

호스트가 그 사이 다른 편집을 했으면 conflict → 클라이언트에 `INVITATION_VERSION_CONFLICT`.

→ 8번 챕터의 낙관적 락과 같은 패턴.

---

## 8. 동시 요청 차단 — Idempotency-Key

```
POST /ai/generations
Idempotency-Key: <uuid>
```

- 같은 키로 동일 요청 짧은 시간 내 재전송 → 첫 응답을 재사용
- 진행 중 → `IDEMPOTENCY_IN_PROGRESS` (409)

→ apps/api/src/idempotency/ 모듈.

---

## 9. 에러 코드 정리

| 코드 | 상태 | 상황 |
|---|---|---|
| `AI_PROCESSING_FAILED` | 500 | OpenAI 합성 실패 |
| `AI_TIMEOUT` | 504 | 60초 응답 없음 |
| `AI_TEMPLATE_NOT_FOUND` | 404 | 템플릿 없음 |
| `AI_DAILY_LIMIT_EXCEEDED` | 429 | 3회/일 초과 |
| `AI_SERVICE_UNAVAILABLE` | 503 | 서킷 open |
| `AI_GENERATION_NOT_FOUND` | 404 | 본인 generation 아님 |

---

## 10. 흔한 함정

### timeout 시 worker가 OpenAI 응답을 받아도 사용 못 함
- 60s 넘어 결과가 오면 → DB는 이미 failed, S3엔 결과 없음
- 결과를 받더라도 무시 (또는 별도 cleanup)

### 한도를 user 단위로 카운트하는데 카운트 비용
- `WHERE user_id = ? AND created_at > now() - INTERVAL '24 hours'` 매번 카운트
- → 인덱스 `(user_id, created_at)` 필수 (schema에 있음)

### `sourceImageKey` 검증 누락
- 다른 user의 이미지 키를 전달해 합성 → 정보 유출 가능
- 본인 키인지 검증 필수

---

## 11. 체크리스트

- [ ] `ai_image_jobs`와 `ai_generations` 차이를 안다
- [ ] 일일 한도 race condition 위험 + 보강 방향을 안다
- [ ] 서킷 브레이커가 무엇을 보호하는지 안다
- [ ] S3 1시간 lifecycle의 의도와 미적용 상태를 안다
- [ ] Idempotency-Key의 역할을 안다

→ 다음: [11. 실시간 (DM/위치)](./11-realtime-dm-location.md)
