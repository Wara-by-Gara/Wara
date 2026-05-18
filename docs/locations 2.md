# 위치 공유 기능 (Locations)

> **대상 독자**: 처음 이 기능을 보는 팀원  
> **마지막 수정**: 2026-05-15

---

## 목차

1. [기능 개요](#기능-개요)
2. [전체 구조](#전체-구조)
3. [DB 테이블](#db-테이블)
4. [파일 구성](#파일-구성)
5. [REST API](#rest-api)
6. [WebSocket 실시간 위치 공유](#websocket-실시간-위치-공유)
7. [카카오 지도 장소 검색](#카카오-지도-장소-검색)
8. [환경변수 설정](#환경변수-설정)
9. [클라이언트 연동 가이드](#클라이언트-연동-가이드)

---

## 기능 개요

모임 초대장에 위치 공유 기능을 제공합니다.

- **호스트**가 모임 장소(행사 위치)를 카카오 지도에서 검색하여 초대장에 등록합니다.
- **모임 시작 15분 전**부터 모든 참석자의 GPS가 활성화되고, 지도에 실시간으로 위치가 표시됩니다.
- 참석자가 모임 장소에 **도착하면** 앱이 자동으로 GPS를 비활성화합니다.
- 호스트는 아직 오지 않은 참석자에게 **개별 알림**을 보낼 수 있습니다.

---

## 전체 구조

```
클라이언트
  │
  ├── REST API (HTTP)
  │     ├── 행사 장소 등록 / 조회 / 삭제
  │     └── 장소 검색 (카카오 API 프록시)
  │
  └── WebSocket (/locations 네임스페이스)
        └── 실시간 위치 업데이트 & 브로드캐스트

서버
  LocationsController          ← REST: 행사 장소, 참석자 위치 조회
  LocationsSearchController    ← REST: 카카오 장소 검색
  LocationsGateway             ← WebSocket: 실시간 위치 공유
  LocationsService             ← 비즈니스 로직
  LocationsRepository          ← DB 접근
  KakaoLocalService            ← 카카오 Local REST API 호출
```

### 왜 REST와 WebSocket을 함께 쓰나요?

| 상황 | 프로토콜 | 이유 |
|------|----------|------|
| 행사 장소 등록 / 삭제 | REST (PUT, DELETE) | 일회성 변경 작업 |
| 행사 장소 / 참석자 위치 최초 조회 | REST (GET) | 페이지 진입 시 한 번만 필요 |
| 참석자 실시간 위치 업데이트 | WebSocket | 초 단위로 반복 전송, HTTP보다 가볍고 빠름 |

---

## DB 테이블

### event_locations (행사 위치)

초대장 1개당 행사 장소 1개. 호스트만 등록/수정/삭제 가능.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text (ULID) | 기본키 |
| invitation_id | text | 초대장 ID (unique) |
| address | text | 도로명/지번 주소 |
| place_name | varchar(100) | 장소명 (예: 스타벅스 강남점) |
| detail_address | text | 상세 주소 (예: 3층) |
| lat | double | 위도 (-90 ~ 90) |
| lng | double | 경도 (-180 ~ 180) |
| place_id | text | 카카오 장소 ID (프론트 딥링크용) |

### participant_locations (참석자 위치)

참석자 1명당 초대장별 위치 1개. 실시간으로 계속 덮어씌워짐(upsert).

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text (ULID) | 기본키 |
| invitation_id | text | 초대장 ID |
| participant_id | text | 참석자 ID |
| lat | double | 현재 위도 |
| lng | double | 현재 경도 |
| accuracy | double | GPS 정확도 (미터 단위, 클수록 부정확) |
| is_arrived | boolean | 도착 여부 (기본값 false) |

> `(invitation_id, participant_id)` 조합이 unique — 같은 참석자가 같은 초대장에 위치를 여러 번 보내도 1개 row만 유지됩니다.

---

## 파일 구성

```
src/locations/
├── dto/
│   ├── set-event-location.dto.ts        # 행사 장소 등록 요청 스키마
│   ├── update-participant-location.dto.ts  # 참석자 위치 업데이트 스키마
│   └── place-search-query.dto.ts        # 장소 검색 쿼리 스키마
├── locations.controller.ts              # 행사 장소 + 참석자 위치 REST 엔드포인트
├── locations-search.controller.ts       # 장소 검색 REST 엔드포인트
├── locations.gateway.ts                 # WebSocket 게이트웨이
├── locations.service.ts                 # 비즈니스 로직
├── locations.repository.ts              # DB 쿼리
├── kakao-local.service.ts               # 카카오 API HTTP 클라이언트
└── locations.module.ts                  # 모듈 등록
```

---

## REST API

> 모든 REST 요청은 `Authorization: Bearer {accessToken}` 헤더 필요

### 행사 장소

#### 행사 장소 조회
```
GET /invitations/:invitationId/location
```
응답:
```json
{
  "success": true,
  "data": {
    "id": "01ARZ3NDEK...",
    "invitationId": "01ARZ3NDEK...",
    "address": "서울 강남구 테헤란로 212",
    "placeName": "스타벅스 강남점",
    "detailAddress": "3층",
    "lat": 37.498,
    "lng": 127.028,
    "placeId": "1234567"
  }
}
```

#### 행사 장소 등록 / 수정 (HOST 전용)
```
PUT /invitations/:invitationId/location
```
요청 body:
```json
{
  "address": "서울 강남구 테헤란로 212",
  "placeName": "스타벅스 강남점",
  "detailAddress": "3층",
  "lat": 37.498,
  "lng": 127.028,
  "placeId": "1234567"
}
```
> 장소가 없으면 새로 만들고, 이미 있으면 덮어씁니다(upsert).

#### 행사 장소 삭제 (HOST 전용)
```
DELETE /invitations/:invitationId/location
```
응답: `204 No Content`

---

### 참석자 위치

#### 전체 참석자 위치 조회
```
GET /invitations/:invitationId/participant/locations
```
> 지도 초기 로딩 시 1회 호출. 이후 실시간 업데이트는 WebSocket으로 받습니다.

응답:
```json
{
  "success": true,
  "data": [
    {
      "id": "01ARZ3NDEK...",
      "participantId": "01ARZ3NDEK...",
      "lat": 37.501,
      "lng": 127.025,
      "accuracy": 8.5,
      "isArrived": false
    }
  ]
}
```

---

## WebSocket 실시간 위치 공유

### 연결 방법

Socket.IO를 사용합니다. 네임스페이스는 `/locations`.

```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.wara.com/locations', {
  auth: {
    token: 'Bearer eyJhbGci...'  // 액세스 토큰
  }
});
```

> 토큰이 없거나 유효하지 않으면 서버가 연결을 즉시 끊습니다.

---

### 이벤트 흐름

```
클라이언트                          서버
    │                                │
    │── location:subscribe ─────────>│  초대장 방 입장
    │                                │
    │── location:update ────────────>│  내 위치 전송
    │                                │  DB 저장
    │<── location:updated ───────────│  방 전체에 브로드캐스트
    │                                │
    │── location:unsubscribe ───────>│  방 퇴장
```

---

### 이벤트 상세

#### `location:subscribe` — 방 입장 (필수, 연결 직후 호출)

```javascript
socket.emit('location:subscribe', { invitationId: '01ARZ3NDEK...' });
```

> 이걸 먼저 해야 `location:updated`를 받을 수 있습니다.

---

#### `location:update` — 내 위치 전송

```javascript
socket.emit('location:update', {
  invitationId: '01ARZ3NDEK...',
  lat: 37.501,
  lng: 127.025,
  accuracy: 8.5,
  isArrived: false   // 도착했으면 true
});
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| invitationId | string | ✅ | |
| lat | number | ✅ | 위도 |
| lng | number | ✅ | 경도 |
| accuracy | number | ✅ | GPS 정확도 (미터) |
| isArrived | boolean | ✗ | 생략 시 기존 값 유지 |

---

#### `location:updated` — 참석자 위치 수신 (브로드캐스트)

같은 방의 모든 클라이언트(나 포함)에게 전송됩니다.

```javascript
socket.on('location:updated', (location) => {
  // location.participantId 로 누구인지 식별
  // 지도 위 해당 참석자 마커 업데이트
  console.log(location);
});
```

응답 데이터:
```json
{
  "id": "01ARZ3NDEK...",
  "participantId": "01ARZ3NDEK...",
  "invitationId": "01ARZ3NDEK...",
  "lat": 37.501,
  "lng": 127.025,
  "accuracy": 8.5,
  "isArrived": false,
  "updatedAt": "2026-05-15T10:00:00.000Z"
}
```

---

#### `location:unsubscribe` — 방 퇴장

```javascript
socket.emit('location:unsubscribe', { invitationId: '01ARZ3NDEK...' });
```

> GPS 비활성화 시(도착 or 화면 이탈) 호출하세요.

---

### 도착 감지 로직 (클라이언트 구현)

서버는 도착 여부를 계산하지 않습니다. **앱에서 직접 계산**해서 `isArrived: true`를 보내주세요.

```javascript
// Haversine 공식으로 두 좌표 간 거리(미터) 계산
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GPS 업데이트마다 실행
const ARRIVAL_THRESHOLD_METERS = 50;

function onGpsUpdate(myLat, myLng) {
  const dist = getDistance(myLat, myLng, eventLat, eventLng);
  const isArrived = dist <= ARRIVAL_THRESHOLD_METERS;

  socket.emit('location:update', {
    invitationId,
    lat: myLat,
    lng: myLng,
    accuracy: gpsAccuracy,
    isArrived,
  });

  if (isArrived) {
    // GPS 비활성화 + 방 퇴장
    stopGps();
    socket.emit('location:unsubscribe', { invitationId });
  }
}
```

---

## 카카오 지도 장소 검색

호스트가 행사 장소를 등록할 때 사용합니다. 카카오 API 키는 서버에서 관리하므로 클라이언트에 노출되지 않습니다.

```
GET /locations/search?query=스타벅스 강남점
GET /locations/search?query=스타벅스&page=2&size=10
```

| 파라미터 | 필수 | 기본값 | 범위 | 설명 |
|---------|:----:|--------|------|------|
| query | ✅ | — | — | 검색어 |
| page | ✗ | 1 | 1~45 | 페이지 번호 |
| size | ✗ | 15 | 1~15 | 페이지당 결과 수 |

응답:
```json
{
  "success": true,
  "data": {
    "places": [
      {
        "placeId": "1234567",
        "placeName": "스타벅스 강남점",
        "address": "서울 강남구 역삼동 830",
        "roadAddress": "서울 강남구 테헤란로 212",
        "lat": 37.498,
        "lng": 127.028,
        "phone": "02-555-0000",
        "category": "음식점 > 카페",
        "placeUrl": "https://place.map.kakao.com/1234567",
        "distance": null
      }
    ],
    "meta": {
      "totalCount": 32,
      "pageableCount": 32,
      "isEnd": true
    }
  }
}
```

> 검색 결과에서 장소를 선택하면, 응답의 `placeId`, `placeName`, `address`, `lat`, `lng`을 그대로 `PUT /invitations/:invitationId/location` body에 담아 보내면 됩니다.

---

## 환경변수 설정

`.env.development` 파일에 아래 항목을 추가하세요.

```env
KAKAO_REST_API_KEY=여기에_카카오_REST_API_키_입력
```

카카오 REST API 키 발급: [카카오 Developers](https://developers.kakao.com) → 앱 만들기 → REST API 키 복사

---

## 클라이언트 연동 가이드

### 전체 플로우

```
1. 화면 진입
   └── GET /invitations/:id/location          → 행사 장소 lat/lng 저장
   └── GET /invitations/:id/participant/locations → 초기 위치 데이터로 마커 렌더링

2. WebSocket 연결
   └── io('/locations', { auth: { token } })
   └── socket.emit('location:subscribe', { invitationId })

3. GPS 시작 (모임 시작 15분 전)
   └── watchPosition() 시작
   └── 매 GPS 업데이트마다 socket.emit('location:update', { ... })

4. 실시간 수신
   └── socket.on('location:updated', ...) → 해당 participantId 마커 갱신

5. 도착 감지
   └── 거리 <= 50m → isArrived: true 전송 → GPS 중지 → unsubscribe
```

### 에러 처리

| 상황 | 처리 방법 |
|------|----------|
| WebSocket 연결 끊김 | Socket.IO 자동 재연결 (`reconnection: true` 기본값) |
| `location:update`에서 WsException 수신 | `socket.on('exception', ...)` 으로 수신 |
| 토큰 만료로 연결 끊김 | 액세스 토큰 갱신 후 재연결 |
