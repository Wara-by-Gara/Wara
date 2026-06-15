# 11. 실시간 (DM / 위치)

> Socket.IO 기반 두 가지 실시간 기능 — 1:1·단톡 DM과 모임 당일 위치 공유.

---

## 1. 왜 Socket.IO인가

### 옵션 비교
- **순수 WebSocket**: 재연결·하트비트·룸 같은 걸 직접 짜야 함
- **Socket.IO**: 그 모두를 묶어둠 + namespace/room 추상
- **SSE (Server-Sent Events)**: 단방향만 (서버→클라이언트) — DM 부적합

→ WARA는 Socket.IO (`@nestjs/platform-socket.io` + `socket.io`).

### Redis adapter
`@socket.io/redis-adapter`로 여러 인스턴스 간 이벤트 동기화.
현재는 EC2 1대지만 향후 스케일 대비.

---

## 2. DM 도메인

### `conversations` (`schema/conversations.ts:13`)
```ts
export const conversations = pgTable('conversations', {
  id:              text('id').primaryKey().$defaultFn(() => ulid()),
  type:            text('type').notNull().default('direct'),  // 'direct' | 'group'
  title:           text('title'),                              // 그룹용
  directKey:       text('direct_key').unique(),                // 'min(uid):max(uid)' 정규화 키
  lastMessageText: text('last_message_text'),                  // 목록 미리보기용 비정규화
  lastMessageAt:   timestamp('last_message_at', { withTimezone: true }),
  ...
});
```

#### `directKey` — 1:1 중복 방지
- 같은 두 사용자가 동시에 "대화 시작" 누르면 1:1 방이 2개 생길 위험
- `directKey = min(userIdA, userIdB) + ':' + max(userIdA, userIdB)` 형태로 정규화
- DB unique 제약으로 중복 차단
- group은 항상 null (1:1만 unique 보장)

#### `lastMessageText / lastMessageAt` — 비정규화 캐시
- 대화 목록 페이지에서 각 방의 최근 메시지를 표시
- 매번 messages 테이블 JOIN하면 비쌈
- 메시지 전송 때마다 함께 갱신

### `conversation_participants`
```ts
{
  conversationId: ...,
  userId:         ...,
  lastReadAt:     timestamp(...),  // 안 읽음 수 기준
  alias:          text('alias'),   // 이 유저만 보이는 방 별명
  leftAt:         timestamp(...),  // 카톡식 "나가기"
  joinedAt:       timestamp(...),  // (재)입장 시각
}
```

#### `leftAt` + `joinedAt` — 카톡식 나가기
- `leftAt` 이전 메시지는 내 화면에서 숨김
- 새 메시지(leftAt 이후) 오면 목록에 다시 등장
- 상대방 기록은 그대로 보임 (한쪽만 안 보임)

### `messages`
```ts
{
  conversationId: ...,
  senderId:       ...,
  type:           text('type').notNull().default('user'),  // 'user' | 'system'
  content:        text('content').notNull(),
  imageKey:       text('image_key'),                       // 이미지 메시지
  replyToMessageId: text('reply_to_message_id').references(() => messages.id, { onDelete: 'set null' }),
  editedAt:       timestamp(...),
  createdAt:      ...,
  deletedAt:      ...,
}
```

#### `type='system'`
- 입장/퇴장 알림 ("X님이 입장했습니다")
- 말풍선 없이 가운데 표시
- senderId는 시스템 동작자 user

#### `replyToMessageId`
- 답장 기능 (자기 참조 FK)
- 원본 삭제 시 `set null`

### `message_reactions`
```ts
{
  messageId: ...,
  userId:    ...,
  emoji:     text('emoji').notNull(),  // 'heart' | 'thumbsup' | 'check' | 'smile' | 'surprise' | 'cry'
}
// unique (messageId, userId) — 유저당 메시지에 1개만
```

- 같은 이모지면 취소, 다른 이모지면 교체

---

## 3. DM 메시지 전송 흐름

```
[1] 클라이언트 → Socket emit 'message:send' { conversationId, content, imageKey? }
[2] 서버 Gateway
     ├─ 검증 (참가자인지)
     ├─ 이미지 메시지면 imageKey가 그 conversation prefix인지 검증
     │   (다른 방 키 도용 차단 — MESSAGE_IMAGE_INVALID)
     ├─ messages INSERT
     ├─ conversations.lastMessageText/At UPDATE
     └─ 같은 room의 다른 참가자에게 'message:new' broadcast
[3] 다른 클라이언트들이 메시지 수신 → 화면 갱신
```

### Room 모델
- 각 conversation = 1개 room
- 사용자가 그 room에 join하면 메시지 수신 가능
- 페이지 이동해도 socket 연결은 유지 (layout에 mount된 컴포넌트)

---

## 4. 이미지 메시지

### 업로드 흐름
1. presigned URL 요청 (conversation prefix 포함)
2. 클라이언트가 S3에 직접 PUT
3. message:send에 imageKey 포함
4. 서버가 prefix 검증 → `messages.imageKey` 저장
5. 조회 시 GET presigned URL로 변환해 응답

→ 사진 앨범과 같은 패턴 (09 챕터).

---

## 5. 단톡방 (그룹)

### 제한
- 최대 30명 (`GROUP_MEMBER_LIMIT_EXCEEDED`)
- 초대 시 기존 멤버 / 존재하지 않는 user 제외 후 결과가 0명이면 `GROUP_NO_VALID_INVITEES`

### 카톡과 다른 점
- conversation은 hard delete 안 함 — `deletedAt`로 soft delete

---

## 6. 위치 도메인 (`schema/locations.ts`)

### `event_locations` (모임 장소)
- 초대장당 1개 (unique constraint)
- 좌표 + 주소 + place_name + place_id (카카오/네이버 지도 API)
- bbox 쿼리용 복합 인덱스 `(lat, lng)` (탐색 페이지 지도)

### `participant_locations` (참가자 실시간 위치)
```ts
{
  invitationId:  ...,
  participantId: ...,
  accuracy:      doublePrecision(...).notNull(),  // GPS 정확도(m)
  lat:           ...,
  lng:           ...,
  isArrived:     boolean(...).notNull().default(false),
  statusMessage: varchar('status_message', { length: 100 }),  // "5분 늦어요"
}
// unique (invitationId, participantId) — 한 모임에 한 참가자 위치 1행
```

### check 제약
```ts
check('check_participant_location_coords', sql`${t.lat} >= -90 AND ${t.lat} <= 90 AND ${t.lng} >= -180 AND ${t.lng} <= 180`)
```
→ DB 레벨에서 잘못된 좌표 차단.

---

## 7. 실시간 위치 흐름

```
[1] 클라이언트 (모바일) → 일정 주기로 GPS 수집
[2] Socket emit 'location:update' { lat, lng, accuracy }
[3] 서버
     ├─ tier 검증 (Privacy)
     ├─ participantLocations UPSERT
     │   (위 unique 제약 활용 — 매 update가 같은 row 갱신)
     ├─ 도착 여부 판정 (event_locations와의 거리 < 50m → isArrived=true)
     └─ 같은 invitation의 다른 참가자에게 broadcast
[4] 다른 클라이언트 → 지도 핀 이동
```

### Privacy tier
- 호스트는 모든 참가자 위치 항상 보임
- 게스트는 모임 시작 시각 ±30분 사이에만 다른 참가자 위치 공개
- 게스트 본인이 위치 공유 off면 broadcast 제외

---

## 8. 알림 (notifications)

DM·날짜 투표 마감 등 다양한 이벤트가 알림으로 → `notifications` 테이블 + Socket으로 즉시 푸시.

```
이벤트 발생 → notifications INSERT → 사용자별 socket room에 'notification:new' emit
```

`NotificationSocketMount` 컴포넌트가 layout에 mount되어 어디서든 수신.

---

## 9. WebSocket 어댑터

`apps/api/src/adapters/socket-io.adapter.ts`:
- `WaraIoAdapter`로 CORS 설정을 서버 레벨에서 일괄 적용
- namespace별 CORS는 안 됨 → 어댑터에서 한 번에

`main.ts:101`:
```ts
app.useWebSocketAdapter(new WaraIoAdapter(app));
```

---

## 10. 흔한 함정

### Socket 연결 끊김 후 재연결
- Socket.IO가 자동 재연결
- 재연결 시 다시 room join 필요 → 클라이언트의 `connect` 핸들러에서 join 재실행

### 이미지 키 도용
- 다른 conversation의 imageKey를 가져와 메시지 전송 → 정보 유출 가능
- → 서버가 imageKey prefix 검증 (`MESSAGE_IMAGE_INVALID`)

### 단톡방 메시지가 leftAt 후 메시지로 안 보임
- leftAt 후 새 메시지가 와야 목록에 재등장
- 의도된 동작 (카톡과 같음)

### 위치 broadcast race
- 한 참가자가 1초에 여러 번 location:update → DB 부하
- 클라이언트에서 throttle (예: 5초마다)

---

## 11. 체크리스트

- [ ] `directKey`가 1:1 중복을 어떻게 막는지 안다
- [ ] `leftAt`/`joinedAt`이 카톡식 나가기를 어떻게 구현하는지 안다
- [ ] 이미지 메시지가 conversation prefix 검증을 거치는 이유를 안다
- [ ] 위치 tier(호스트/게스트) 차이를 안다
- [ ] Socket.IO Redis adapter가 왜 필요한지 안다 (수평 확장)

→ 다음: [12. 날짜 투표](./12-date-vote.md)
