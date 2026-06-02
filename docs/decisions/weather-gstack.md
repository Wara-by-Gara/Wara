# Weather 도메인 — Gstack

> weather-domain.md 설계 기반 구현 체크리스트.
> 위에서 아래로 순서대로 진행 (의존성 순서).

---

## 0. DB 마이그레이션

**없음.** 스키마 변경 없이 기존 `event_locations.lat/lng`, `invitations.event_start_at` 그대로 사용.

---

## 1. 에러 코드

### `src/common/constants/error-codes.ts`
- [ ] 파일 끝 `as const` 블록에 추가
  ```typescript
  // 날씨
  WEATHER_API_TIMEOUT: 'WEATHER_API_TIMEOUT',
  WEATHER_API_FAILED: 'WEATHER_API_FAILED',
  ```

> `error-codes.md` 수정은 담당자 확인 후 진행.

---

## 2. 환경변수

### `apps/api/.env.example`
- [ ] `KMA_API_KEY=` 항목 추가

---

## 3. 유틸 함수 (순수 함수, 의존성 없음)

### `src/weather/utils/grid-converter.ts`
- [ ] `latLngToGrid(lat: number, lng: number): { nx: number; ny: number }` 구현
  - 기상청 Lambert Conformal Conic 격자 변환 (공개 상수 그대로 사용)
  - 상수: `RE=6371.00877`, `GRID=5.0`, `SLAT1=30.0`, `SLAT2=60.0`, `OLON=126.0`, `OLAT=38.0`, `XO=43`, `YO=136`
  - 반환값 `Math.floor` 처리 (정수 격자)

### `src/weather/utils/base-time.ts`
- [ ] `getBaseDateTime(now: Date): { baseDate: string; baseTime: string }` 구현
  - **KST 기준으로 산출**: `nowKst = new Date(now.getTime() + 9 * 60 * 60 * 1000)`
  - 발표 시각 목록(KST): `['0200','0500','0800','1100','1400','1700','2000','2300']`
  - `nowKst` 기준 가장 최근 발표 시각 선택
  - **발표 후 10분 이내면 이전 시각 사용** (기상청 데이터 생성 지연 여유)
  - `baseDate`: `nowKst` 기준 `YYYYMMDD` (발표 시각이 KST 자정 이전이면 전날 날짜)
  - `baseTime`: `HHmm` 문자열
- [ ] `getForecastTime(eventStartAt: Date): string` 구현
  - fcstTime은 **1시간 단위** (0000, 0100, ..., 2300)
  - **기상청 API는 KST 기준** → `eventStartAt`(UTC)에 +9h 변환 후 hour 추출
    ```typescript
    const kstHour = (eventStartAt.getUTCHours() + 9) % 24;
    return String(kstHour).padStart(2, '0') + '00'; // 9 → '0900'
    ```
  - 별도 기본값 처리 없음 — KST 변환 공식이 모든 케이스 처리
    - UTC 00:00 → KST 09:00 → `'0900'`
    - startTime 미설정 확정(KST 자정) → UTC T15:00 → KST 00:00 → `'0000'`
- [ ] `getForecastDate(eventStartAt: Date): string` 구현
  - **기상청 fcstDate는 KST 기준 YYYYMMDD**
  - `eventStartAt`(UTC) → KST 변환 후 날짜 추출
    ```typescript
    const kstMs = eventStartAt.getTime() + 9 * 60 * 60 * 1000;
    const d = new Date(kstMs);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
    ```

### `src/weather/utils/condition-mapper.ts`
- [ ] `WeatherCondition` 타입 정의 및 export (이 파일이 단일 출처)
  ```typescript
  export type WeatherCondition = '맑음' | '구름 조금' | '흐림' | '비' | '소나기' | '눈';
  ```
- [ ] `toCondition(sky: string, pty: string): WeatherCondition` 구현
  - PTY 우선: `1|2`→비, `3`→눈, `4`→소나기
  - PTY=0일 때 SKY: `1`→맑음, `3`→구름 조금, `4`→흐림
- [ ] `toMessage(condition: WeatherCondition): string` 구현
  - 맑음/구름 조금 → `'가볍게 입고 와도 좋아요'`
  - 흐림 → `'겉옷 하나 챙기면 좋아요'`
  - 비 → `'우산 꼭 챙기세요'`
  - 소나기 → `'접이식 우산 챙기면 좋아요'`
  - 눈 → `'미끄러우니 조심해서 오세요'`

---

## 4. KmaWeatherClient

### `src/weather/kma-weather.client.ts`
- [ ] `@Injectable()` 클래스
- [ ] `ConfigService`로 `KMA_API_KEY` 주입
- [ ] `KmaForecastParams`, `KmaForecastItem` 인터페이스 정의 및 **export** (WeatherService에서 import)
  ```typescript
  export interface KmaForecastParams { nx: number; ny: number; base_date: string; base_time: string; }
  export interface KmaForecastItem { category: string; fcstDate: string; fcstTime: string; fcstValue: string; }
  ```
- [ ] `getForecast(params: KmaForecastParams): Promise<KmaForecastItem[]>`
  - 기상청 단기예보 endpoint: `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`
  - query: `serviceKey`, `pageNo=1`, `numOfRows=1000`, `dataType=JSON`, `base_date`, `base_time`, `nx`, `ny`
    > 단기예보 하루 데이터 ~290개. 100으로는 부족하므로 1000으로 설정.
  - HTTP 호출: `HttpService` + `firstValueFrom` (kakao-local.service.ts 동일 패턴)
    > `GatewayTimeoutException`, `BadGatewayException` — `@nestjs/common`에서 import
  - 타임아웃 10초 — 초과 시 `throw new GatewayTimeoutException(ErrorCode.WEATHER_API_TIMEOUT)` (504)
  - 응답 `response.header.resultCode !== '00'` → `throw new BadGatewayException(ErrorCode.WEATHER_API_FAILED)` (502)
  - 카테고리 필터: `['TMP','SKY','PTY','POP']`
  - `fcstTime` 필터는 **Service에서** 처리 — Client는 전체 항목 반환 (캐시 재사용 극대화)
  - `fcstDate` 필터도 Service에서 처리

---

## 5. WeatherRepository

### `src/weather/weather.repository.ts`
- [ ] `@Injectable()` 클래스, `@Inject(DRIZZLE)` 주입 (DatabaseModule이 @Global()이므로 별도 import 불필요)
- [ ] `findInvitationWithLocation(invitationId: string)`
  - `invitations` + `eventLocations` join (with 패턴) — `invitationsRelations`에 `eventLocation` 이미 정의됨
  - `deletedAt IS NULL` 조건 포함
  - 반환: `{ eventStartAt, eventLocation: { lat, lng } | null } | null`
  > `InvitationsRepository.findById`와 동일 쿼리 중복 — `Service ↔ Service 직접 호출 금지` 원칙에 따른 의도적 trade-off

---

## 6. WeatherService

### `src/weather/weather.service.ts`
- [ ] `@Injectable()` 클래스
- [ ] In-memory 캐시 선언 — 캐시 단위는 **KMA 응답 전체** (fcstTime 무관, 같은 격자/발표시각 재사용)
  ```typescript
  // KmaForecastItem은 kma-weather.client.ts에서 import
  private readonly cache = new Map<string, { data: KmaForecastItem[]; expiresAt: number }>();
  ```
- [ ] `getWeather(invitationId: string): Promise<WeatherResponseDto | null>`
  1. `weatherRepository.findInvitationWithLocation(invitationId)` → 없으면 `INVITATION_NOT_FOUND` throw
  2. `eventStartAt` 또는 `eventLocation` 없으면 `null` 반환 (→ 204)
  3. `eventStartAt.getTime() < Date.now()` 이면 `null` 반환 (→ 204, 모임이 이미 지남)
  4. `eventStartAt.getTime() - Date.now() > 72 * 60 * 60 * 1000` 이면 `null` 반환 (→ 204, 3일 초과)
  5. `latLngToGrid(lat, lng)` → `{ nx, ny }`
  6. `getBaseDateTime(new Date())` → `{ baseDate, baseTime }` (KST 기준)
  7. `getForecastTime(eventStartAt)` → `fcstTime` (KST 기준, 1시간 단위)
  8. `cacheKey = \`weather:${nx}:${ny}:${baseDate}:${baseTime}\`` ← fcstTime 제외
  9. 캐시 HIT (`expiresAt > Date.now()`) → 캐시의 `KmaForecastItem[]` 사용
  10. 캐시 MISS → `kmaClient.getForecast({ nx, ny, base_date: baseDate, base_time: baseTime })` 호출
  11. 응답 전체를 캐시 저장: `expiresAt = Date.now() + 3 * 60 * 60 * 1000`
  12. `getForecastDate(eventStartAt)` → `fcstDate` (KST 기준 YYYYMMDD)
  13. `fcstDate` + `fcstTime` 으로 항목 필터링
  14. `TMP`, `SKY`, `PTY`, `POP` 값 추출 → `toCondition`, `toMessage` 가공
  15. `Logger.debug(...)` — `invitationId`, `base_date/time`, `fcstTime`, `nx/ny`, `cache=hit|miss`
  16. `WeatherResponseDto` 반환

---

## 7. DTO

### `src/weather/dto/weather-response.dto.ts`
- [ ] `WeatherResponseDto` 클래스 (응답 직렬화용) — `WeatherSummary`와 **동일 구조**, 별도 변환 불필요
  ```typescript
  export class WeatherResponseDto {
    condition: string;        // WeatherCondition (직렬화 시 string)
    temperature: number;
    precipProbability: number;
    message: string;
  }
  ```
  > `WeatherService`는 `WeatherResponseDto`를 직접 반환 타입으로 사용.
  > `WeatherSummary` 인터페이스는 별도로 선언하지 않고 `WeatherResponseDto`로 통일.

---

## 8. WeatherController

### `src/weather/weather.controller.ts`
- [ ] `@Controller('invitations/:invitationId/weather')`
- [ ] `@UseGuards(ParticipantGuard)` — 참가자 검증
- [ ] `@Get()`
  ```typescript
  // 파일 상단에 import 필수
  // import { Response } from 'express';
  //날씨 데이터가 아직 없어서 응답 본문 없이 204 No Content 명시하기 위해 

  @Get()
  @UseGuards(ParticipantGuard)
  async getWeather(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<WeatherResponseDto | void> {
    const result = await this.weatherService.getWeather(invitationId);
    if (!result) {
      res.status(204).send();
      return;
    }
    return result;
  }
  ```
  > `@HttpCode(200)` 제거. `undefined` 반환해도 NestJS가 자동으로 204를 보장하지 않으므로
  > `@Res({ passthrough: true })`로 명시적 처리. `passthrough: true` 옵션으로 나머지 반환값은 정상 직렬화됨.
  > `Response`는 반드시 `express`에서 import (auth.controller.ts 동일 패턴).

---

## 9. WeatherModule

### `src/weather/weather.module.ts`
- [ ] providers: `WeatherService`, `WeatherRepository`, `KmaWeatherClient`
- [ ] imports: `HttpModule` (KmaWeatherClient용), `AuthModule` (ParticipantGuard DI)
  > `ConfigModule`은 `isGlobal: true`이므로 import 불필요
- [ ] controllers: `WeatherController`

### `src/app.module.ts`
- [ ] `WeatherModule` imports 배열에 추가

---

## 10. 검증

- [ ] `eventStartAt` 없음 → 204
- [ ] `eventLocation` 없음 → 204
- [ ] `eventStartAt` 이미 지난 날짜 → 204
- [ ] `eventStartAt` 72시간 초과 → 204
- [ ] 정상 케이스 → 200 + `{ condition, temperature, precipProbability, message }`
- [ ] 기상청 API 타임아웃 → 504
- [ ] 비참가자 요청 → 403
- [ ] `pnpm lint && pnpm typecheck && pnpm build`

---

## 구현 순서 요약

```
1. error-codes.ts — WEATHER_API_TIMEOUT, WEATHER_API_FAILED 추가
2. .env.example — KMA_API_KEY 추가
3. utils/grid-converter.ts
4. utils/base-time.ts
5. utils/condition-mapper.ts
6. kma-weather.client.ts
7. weather.repository.ts
8. weather.service.ts
9. dto/weather-response.dto.ts
10. weather.controller.ts
11. weather.module.ts
12. app.module.ts — WeatherModule 등록
13. 수동 검증 (7개 케이스)
14. pnpm lint && pnpm typecheck && pnpm build
```
