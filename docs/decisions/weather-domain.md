# Weather 도메인 설계

> Matt Pocock 단계 산출물.
> gstack → superpowers 순서로 구현 진행.

---

## 0. 설계 근거

**별도 엔드포인트** (`GET /invitations/:invitationId/weather`)로 분리.

- 기존 초대장 상세 응답 구조 변경 없음 (breaking change 방지)
- 프론트엔드가 `eventStartAt` 기준 3일 이내인 경우에만 선택적 호출 가능
- 날씨 캐시 만료(TTL 3h)와 초대장 캐시 TTL이 달라 별도 관리가 적합

---

## 1. 엔드포인트 계약

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|:----:|------|
| GET | `/invitations/:invitationId/weather` | ✅ | 초대장 날씨 조회 |

### 응답

```typescript
// 200 OK — 날씨 데이터 존재
{
  condition: string;          // "맑음" | "구름 조금" | "흐림" | "비" | "소나기" | "눈"
  temperature: number;        // TMP 기온 (°C, 정수)
  precipProbability: number;  // POP 강수확률 (%, 0~100)
  message: string;            // "가볍게 입고 와도 좋아요" 등 상황별 멘트
}

// 204 No Content — 날씨 조회 불가 (날짜 없음 | 좌표 없음 | 3일 초과)
```

### 에러

| 상황 | 에러 코드 | HTTP |
|---|---|---|
| 초대장 없음 | `INVITATION_NOT_FOUND` | 404 |
| 참가자 아님 | `PARTICIPANT_NOT_FOUND` | 403 |
| 기상청 API 타임아웃 | `WEATHER_API_TIMEOUT` | 504 |
| 기상청 API 실패 | `WEATHER_API_FAILED` | 502 |

> `WEATHER_API_TIMEOUT`, `WEATHER_API_FAILED` → `error-codes.ts` 및 `error-codes.md`에 추가 필요

---

## 2. 레이어 구조 및 타입 계약

### Controller → Service

```typescript
// WeatherController
getInvitationWeather(
  invitationId: string,
  viewer: Participant,
): Promise<WeatherSummary | null>
```

### Service 내부 흐름

```typescript
// WeatherService
getWeather(invitationId: string, viewer: Participant): Promise<WeatherSummary | null>

// 흐름:
// 1. InvitationsRepository.findById(invitationId) — eventLocation join 이미 있음
// 2. eventStartAt, eventLocation null 체크 → null 이면 return null (→ 204)
// 3. 3일 이내 체크: (eventStartAt - now) <= 72h → 초과 시 return null (→ 204)
// 4. lat/lng → nx/ny 변환 (Lambert Conformal Conic 격자 변환)
// 5. base_date, base_time 산출 (가장 가까운 과거 발표 시각: 0200/0500/.../2300)
// 6. cacheKey = `weather:${nx}:${ny}:${base_date}:${base_time}` 조회
// 7. 캐시 HIT → 반환 / MISS → KmaWeatherClient.getForecast() 호출 후 캐시 저장 (TTL 3h)
// 8. 원시 데이터 → WeatherSummary 가공
// 9. Logger.debug(`[weather] invitationId=${invitationId} base=${base_date}/${base_time} nx=${nx} ny=${ny} cache=${hit|miss}`)
```

### KmaWeatherClient

```typescript
interface KmaForecastParams {
  nx: number;
  ny: number;
  base_date: string;  // YYYYMMDD
  base_time: string;  // HHmm (0200/0500/0800/1100/1400/1700/2000/2300)
}

interface KmaForecastItem {
  category: 'TMP' | 'SKY' | 'PTY' | 'POP';
  fcstDate: string;   // YYYYMMDD
  fcstTime: string;   // HHmm
  fcstValue: string;
}

// KmaWeatherClient
getForecast(params: KmaForecastParams): Promise<KmaForecastItem[]>
```

### 타입

```typescript
type WeatherCondition =
  | '맑음'
  | '구름 조금'
  | '흐림'
  | '비'
  | '소나기'
  | '눈';

interface WeatherSummary {
  condition: WeatherCondition;
  temperature: number;
  precipProbability: number;
  message: string;
}

// In-memory 캐시 엔트리
interface WeatherCacheEntry {
  data: WeatherSummary;
  expiresAt: number;  // Date.now() + 3h
}
```

---

## 3. 핵심 로직 명세

### SKY + PTY → condition 매핑

| PTY | SKY | condition |
|:---:|:---:|---|
| 1 (비) | * | 비 |
| 2 (비/눈) | * | 비 |
| 3 (눈) | * | 눈 |
| 4 (소나기) | * | 소나기 |
| 0 | 1 (맑음) | 맑음 |
| 0 | 3 (구름많음) | 구름 조금 |
| 0 | 4 (흐림) | 흐림 |

### condition → message 매핑

| condition | message |
|---|---|
| 맑음 | 가볍게 입고 와도 좋아요 |
| 구름 조금 | 가볍게 입고 와도 좋아요 |
| 흐림 | 겉옷 하나 챙기면 좋아요 |
| 비 | 우산 꼭 챙기세요 |
| 소나기 | 접이식 우산 챙기면 좋아요 |
| 눈 | 미끄러우니 조심해서 오세요 |

### base_time 산출 규칙

기상청 단기예보 발표 시각: 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300

```
현재 시각 기준 가장 최근 발표 시각 선택
단, 발표 후 10분 이내는 이전 발표 시각 사용 (데이터 생성 지연 여유)
```

### lat/lng → nx/ny 변환

기상청 Lambert Conformal Conic 격자 변환 (공개 상수 사용):

```typescript
// 변환 상수 (기상청 공식 문서)
const RE = 6371.00877;   // 지구 반경 (km)
const GRID = 5.0;        // 격자 간격 (km)
const SLAT1 = 30.0;      // 표준위도 1
const SLAT2 = 60.0;      // 표준위도 2
const OLON = 126.0;      // 기준점 경도
const OLAT = 38.0;       // 기준점 위도
const XO = 43;           // 기준점 X 격자
const YO = 136;          // 기준점 Y 격자
```

---

## 4. 모듈 구성

```
src/weather/
  weather.module.ts
  weather.controller.ts
  weather.service.ts
  kma-weather.client.ts
  dto/
    weather-response.dto.ts
  utils/
    grid-converter.ts   // lat/lng → nx/ny
    base-time.ts        // base_date/base_time 산출
    condition-mapper.ts // SKY+PTY → condition+message
```

### 의존성

- `WeatherModule` → `InvitationsModule` (InvitationsRepository 재사용)
- `WeatherController` → Guard: `JwtAuthGuard` + `ParticipantGuard` (기존 패턴 동일)
- 환경변수: `KMA_API_KEY` (기상청 공공데이터포털 API 키)

---

## 5. 환경변수

| 변수 | 설명 |
|---|---|
| `KMA_API_KEY` | 기상청 공공데이터포털 인증키 (decoding 된 값) |

---

## 6. 미결 사항

- [ ] `KMA_API_KEY` 환경변수 이름 팀 확인 (`.env.example`에 추가 필요)
- [ ] `WEATHER_API_TIMEOUT`, `WEATHER_API_FAILED` 에러 코드 → `error-codes.ts` 추가 담당자 확인
- [ ] 기상청 단기예보 커버 범위: `eventStartAt`이 최대 3일이지만 실제 API는 최대 3일(+) 예보 제공 — 경계값 테스트 필요

---

## 7. 향후 검토 사항

### 자정 모임 vs 시간 미정 구분 불가 문제

**배경:**
- 날짜 투표에서 `startTime`은 optional. 시간 없이 날짜만 확정하면 `slot.startTime ?? '00:00'`으로 KST 자정(UTC T15:00Z 전날)이 `eventStartAt`에 저장됨
- 직접 날짜 설정 시에도 시간 입력 없이 날짜 문자열만 보내면 UTC 00:00으로 저장됨
- **결과:** DB만 봐서는 "진짜 자정 모임"인지 "시간 미설정"인지 구분 불가

**현재 처리 방식 (V1):**
- 구분하지 않고 그냥 저장된 시각 기준 날씨 조회
- 시간 미설정 모임 → 사실상 KST 자정 or 오전 9시 기준 날씨 표시
- 사용자 입장에서 부정확할 수 있으나, V1 범위 내에서 허용

**향후 개선 옵션:**
- A. `invitations` 테이블에 `eventTimeSet: boolean` 컬럼 추가 — 날씨 조회 조건으로 사용
- B. `startTime=null` 확정 시 `eventStartAt`에 시각 부분을 null-equivalent 값(ex: `T00:00:00Z`)으로 구분해 저장하는 컨벤션 수립 → 완벽하진 않음
- C. 프론트에서 시간 입력을 필수로 변경 — 가장 근본적 해결

> 검토 시 `date-vote.service.ts:applyConfirmation` 및 `update-invitation.dto.ts` 참고
