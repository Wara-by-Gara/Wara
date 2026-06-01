# 모바일 소셜 로그인 구현 계획서

> 작성일: 2026-06-01  
> 브랜치: feat/mobile-login  
> 대상: 백엔드(NestJS), 모바일 앱 (iOS / Android)

---

## 1. Provider × Platform 지원 매트릭스

| Provider | Web | iOS | Android |
|----------|:---:|:---:|:-------:|
| 카카오   | ✅  | ✅  | ✅      |
| 네이버   | ✅  | ✅  | ✅      |
| 구글     | ✅  | ✅  | ✅      |
| 애플     | ✅  | ✅  | ❌      |

---

## 2. 현황 분석

### 웹 로그인 현황 (변경 없음)

| Provider | 방식 | 토큰 전달 |
|----------|------|----------|
| 카카오   | Authorization Code → 서버 토큰 교환 | HttpOnly Cookie |
| 네이버   | Authorization Code → 서버 토큰 교환 | HttpOnly Cookie |
| 구글     | Authorization Code → 서버 토큰 교환 | HttpOnly Cookie |
| 애플     | OAuth redirect → POST callback → 서버 id_token 검증 | HttpOnly Cookie |

웹 흐름은 그대로 유지. 모바일 전용 엔드포인트만 추가.

### 모바일에서 달라지는 것

| 항목 | 웹 | 모바일 |
|------|----|----|
| 토큰 전달 방식 | HttpOnly Cookie | Response Body (JSON) |
| 토큰 저장소 | 브라우저 Cookie | iOS Keychain / Android Keystore |
| OAuth 흐름 | 브라우저 리다이렉트 | 네이티브 SDK |
| CSRF 보호 | state 파라미터 | SDK가 자체 처리 (state 선택적) |
| 토큰 갱신 | Cookie 자동 전송 | Authorization 헤더 수동 전송 |

### 기존 백엔드 모바일 지원 현황

이미 부분적으로 모바일을 고려한 구현이 되어 있음:

- `Platform.MOBILE` enum 존재
- `POST /auth/refresh` — body에 `{ refreshToken }` 허용
- `POST /auth/logout` — body에 `{ refreshToken }` 허용
- `POST /auth/apple/callback` — id_token 검증 방식 (SDK 친화적)

**미구현 부분**:
- `OauthPolicyService`의 플랫폼 정책이 현재 매트릭스와 불일치 (Google=WEB only, Apple=MOBILE only)
- Kakao/Naver/Google 모바일 SDK 토큰을 받는 엔드포인트 없음
- Apple 웹 OAuth URL 생성 엔드포인트 없음

---

## 3. Provider별 SDK 방식 선택

### Kakao / Naver — Access Token 방식

SDK가 access token을 직접 반환. 서버에 그대로 전달하면 서버가 각 소셜 API를 호출해 유저 정보 조회.

```
Kakao/Naver SDK
  → providerAccessToken (소셜 provider의 access token)
  → POST /auth/kakao/token  또는  POST /auth/naver/token
  → 서버가 /v2/user/me  또는  /v1/nid/me 호출
  → Wara accessToken + refreshToken 반환
```

Authorization Code 방식을 선택하지 않는 이유:
- Kakao SDK의 `loginWithKakaoAccount()`는 access token을 직접 반환 (code를 별도로 얻기 복잡)
- 모바일용 redirect_uri를 별도 관리해야 함 (앱 custom scheme 등록 필요)
- access token 방식이 네이티브 SDK 관행에 부합

### Google — id_token 방식

Google Sign-In SDK는 access token이 아닌 **id_token** (JWT)을 반환. 서버가 Google 공개키로 JWT를 직접 검증하므로 별도 API 호출 불필요.

```
Google Sign-In SDK
  → idToken (Google이 서명한 JWT, 유저 정보 포함)
  → POST /auth/google/token
  → 서버가 Google 공개키로 JWT 검증 + payload에서 유저 정보 추출
  → Wara accessToken + refreshToken 반환
```

Kakao/Naver와 명칭이 다른 이유: Google SDK는 access token과 id_token을 모두 반환하지만, 서버 검증에는 id_token만 사용. 요청 필드명은 통일하여 `providerToken`으로 받되 내부 처리만 다름.

### Apple Sign In — id_token 방식

#### iOS (SDK)
```
Sign In with Apple SDK
  → id_token + authorizationCode + user(최초 1회)
  → POST /auth/apple/callback  (기존 엔드포인트, 변경 없음)
  → Wara accessToken + refreshToken 반환
```

#### Web (OAuth redirect)
```
브라우저 → GET /auth/apple/url  (신규: Apple OAuth URL 반환)
  → Apple 로그인 페이지
  → Apple이 POST /auth/apple/callback 으로 콜백 (기존 엔드포인트, 변경 없음)
  → Wara accessToken + refreshToken + 쿠키 세팅
```

Apple 웹은 `POST /auth/apple/callback`이 이미 존재. URL 생성 엔드포인트만 추가하면 됨.

---

## 4. API 설계

### 신규 엔드포인트

#### `POST /auth/:provider/token` — 모바일 SDK 토큰 교환

모바일 SDK에서 받은 소셜 provider 토큰을 Wara 토큰으로 교환.

- **지원 provider**: `kakao`, `naver`, `google`
- **인증**: Public
- **Rate limit**: 60초당 10회

| Provider | `providerToken` 값 |
|----------|-------------------|
| kakao    | Kakao SDK의 `accessToken` |
| naver    | Naver SDK의 `accessToken` |
| google   | Google SDK의 `idToken` |

**Request**
```http
POST /auth/kakao/token
Content-Type: application/json

{
  "providerToken": "..."
}
```

**Response 200**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "a3f8c2d1e4b5...",
  "isNew": false,
  "needsProfileCompletion": false
}
```

**Response 401** (provider 토큰 검증 실패)
```json
{
  "success": false,
  "error": {
    "code": "AUTH_PROVIDER_TOKEN_INVALID",
    "type": "authentication",
    "message": "AUTH_PROVIDER_TOKEN_INVALID"
  }
}
```

---

#### `GET /auth/apple/url` — Apple 웹 OAuth URL 생성

Apple 웹 로그인 시작점. 클라이언트가 이 URL로 리다이렉트하면 Apple 로그인 페이지로 이동.

- **인증**: Public

**Response 200**
```json
{
  "url": "https://appleid.apple.com/auth/authorize?...",
  "state": "eyJhbGci..."
}
```

---

### 기존 엔드포인트 — 웹/iOS 공용 (변경 없음)

| 엔드포인트 | 용도 |
|-----------|------|
| `GET /auth/apple/state` | Apple CSRF state 발급 (iOS SDK용) |
| `POST /auth/apple/callback` | Apple id_token 검증 + 토큰 발급 (iOS SDK + 웹 공용) |
| `POST /auth/refresh` | 토큰 갱신 (쿠키 또는 body) |
| `POST /auth/logout` | 로그아웃 (쿠키 또는 body) |

### 기존 엔드포인트 — 웹 전용 (변경 없음)

| 엔드포인트 | 용도 |
|-----------|------|
| `GET /auth/:provider/url` | OAuth URL 반환 (kakao/naver/google) |
| `GET /auth/:provider/redirect` | OAuth URL로 리다이렉트 |
| `GET /auth/:provider/callback` | OAuth 코드 수신 + 쿠키 세팅 |
| `POST /auth/:provider/callback` | 웹 code 교환 (SPA 방식) |

---

## 5. 백엔드 변경사항

### 5-1. OauthPolicyService 수정

```typescript
private readonly policies: Record<Provider, Platform[]> = {
  [Provider.GOOGLE]: [Platform.WEB, Platform.MOBILE],  // WEB only → WEB + MOBILE
  [Provider.KAKAO]:  [Platform.WEB, Platform.MOBILE],  // 변경 없음
  [Provider.NAVER]:  [Platform.WEB, Platform.MOBILE],  // 변경 없음
  [Provider.APPLE]:  [Platform.WEB, Platform.MOBILE],  // MOBILE only → WEB + MOBILE
};
```

### 5-2. SocialStrategy 인터페이스 확장

```typescript
export interface SocialStrategy {
  getAuthorizationUrl(platform: Platform, state: string): string;
  authenticate(params: SocialAuthParams): Promise<SocialUser>;
  // 신규: 모바일 SDK 토큰 방식 (Kakao/Naver/Google에서 구현)
  authenticateWithProviderToken?(providerToken: string): Promise<SocialUser>;
}
```

optional로 선언하여 Apple은 별도 흐름 유지.

### 5-3. KakaoStrategy — `authenticateWithProviderToken` 추가

```typescript
async authenticateWithProviderToken(providerToken: string): Promise<SocialUser> {
  // Kakao access token으로 /v2/user/me 직접 호출 (토큰 교환 단계 없음)
  // 기존 authenticate()의 user 매핑 로직 재사용
}
```

### 5-4. NaverStrategy — `authenticateWithProviderToken` 추가

```typescript
async authenticateWithProviderToken(providerToken: string): Promise<SocialUser> {
  // Naver access token으로 /v1/nid/me 직접 호출
}
```

### 5-5. GoogleStrategy — `authenticateWithProviderToken` 추가

Google은 access token이 아닌 id_token을 검증. Google 공개키로 JWT 서명 검증 후 payload에서 유저 정보 추출.

```typescript
async authenticateWithProviderToken(idToken: string): Promise<SocialUser> {
  // GET https://oauth2.googleapis.com/tokeninfo?id_token={idToken}
  // 또는 google-auth-library 패키지로 로컬 검증
  // audience 검증: GOOGLE_MOBILE_CLIENT_ID 일치 여부
  // payload에서 sub, email, name, picture 추출
}
```

> **주의**: 웹용 `GOOGLE_CLIENT_ID`와 모바일용 Client ID가 Google Console에서 별도 발급됨. 환경변수 `GOOGLE_MOBILE_CLIENT_ID` 추가 필요.

### 5-6. AuthService 메서드 추가

```typescript
async socialLoginWithProviderToken(params: {
  provider: Provider;
  providerToken: string;
}): Promise<{ accessToken: string; refreshToken: string; isNew: boolean; needsProfileCompletion: boolean }> {
  this.oauthPolicyService.validatePlatform(params.provider, Platform.MOBILE);
  const strategy = this.socialAuthFactory.getStrategy(params.provider);
  if (!strategy.authenticateWithProviderToken) {
    throw new BadRequestException(`${params.provider} does not support token-based login`);
  }
  const socialUser = await strategy.authenticateWithProviderToken(params.providerToken);
  // 기존 upsertSocialAccount → issueTokens 흐름 재사용
}
```

### 5-7. AuthController — 엔드포인트 추가

```typescript
// POST /auth/:provider/token
@Public()
@Post(':provider/token')
@HttpCode(HttpStatus.OK)
@Throttle({ default: { ttl: 60000, limit: 10 } })
async mobileTokenLogin(
  @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
  @Body(new ZodValidationPipe(MobileTokenSchema)) body: MobileTokenDto,
) {
  return this.authService.socialLoginWithProviderToken({ provider, providerToken: body.providerToken });
}
```

### 5-8. AppleController — Apple 웹 URL 엔드포인트 추가

```typescript
// GET /auth/apple/url
@Public()
@Get('apple/url')
getAppleUrl() {
  const state = this.appleService.generateState();
  const url = this.appleService.getAuthorizationUrl(state);  // 신규 메서드
  return { url, state };
}
```

`AppleService.getAuthorizationUrl(state)`:
```typescript
getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: APPLE_SERVICE_ID,  // 웹용 Service ID (앱 Bundle ID와 다름)
    redirect_uri: APPLE_REDIRECT_URI,
    response_type: 'code id_token',
    response_mode: 'form_post',
    scope: 'name email',
    state,
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}
```

### 5-9. Apple nonce 보완 (iOS SDK용)

```typescript
// apple-callback.dto.ts
nonce: z.string().optional(),

// apple.strategy.ts verifyIdToken에서 nonce 검증
appleSignin.verifyIdToken(idToken, {
  audience: clientId,
  nonce: nonce ? createHash('sha256').update(nonce).digest('hex') : undefined,
});
```

### 5-10. 에러 코드 추가

`error-codes.ts` 및 `error-codes.md`에 추가:

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `AUTH_PROVIDER_TOKEN_INVALID` | 401 | 소셜 provider 토큰 검증 실패 또는 만료 |

### 5-11. 환경변수 추가

```env
GOOGLE_MOBILE_CLIENT_ID=...   # Google Console에서 iOS/Android용 별도 발급
APPLE_SERVICE_ID=...          # Apple Developer Console의 Service ID (웹 OAuth용)
APPLE_REDIRECT_URI=...        # Apple 웹 콜백 URL (기존 APPLE_CLIENT_ID는 iOS Bundle ID)
```

---

## 6. 모바일 앱 구현

### 6-1. SDK 설치

| Provider | iOS | Android |
|----------|-----|---------|
| 카카오   | KakaoSDK (SPM / CocoaPods) | kakao-android-sdk |
| 네이버   | naveridlogin-sdk-ios | naveridlogin-sdk-android |
| 구글     | GoogleSignIn (SPM) | play-services-auth |
| 애플     | AuthenticationServices (내장) | ❌ 미지원 |

### 6-2. Provider별 앱 흐름

#### Kakao (iOS / Android)
```
1. loginWithKakaoAccount() 또는 loginWithKakaoTalk()
2. OAuthToken.accessToken → providerToken
3. POST /auth/kakao/token { providerToken }
4. accessToken(메모리), refreshToken(Keychain/Keystore) 저장
```

#### Naver (iOS / Android)
```
1. NaverThirdPartyLogin 로그인 실행
2. accessToken → providerToken
3. POST /auth/naver/token { providerToken }
4. accessToken(메모리), refreshToken(Keychain/Keystore) 저장
```

#### Google (iOS / Android)
```
1. GIDSignIn.signIn()
2. GIDGoogleUser.idToken.tokenString → providerToken
3. POST /auth/google/token { providerToken }
4. accessToken(메모리), refreshToken(Keychain/Keystore) 저장
```

#### Apple (iOS 전용)
```
1. GET /auth/apple/state → state 수신
2. 앱 내에서 nonce 생성 (raw nonce 보관, SHA256 해시를 Apple에 전달)
3. ASAuthorizationAppleIDRequest 실행
4. 결과: id_token, authorizationCode, user(최초 1회)
5. POST /auth/apple/callback { id_token, code, state, nonce, user }
6. accessToken(메모리), refreshToken(Keychain/Keystore) 저장
```

### 6-3. 토큰 저장 규칙

| 토큰 | 저장 위치 | 이유 |
|------|----------|------|
| Access Token | **메모리 (변수)** | 앱 종료 시 사라짐. 30분 만료이므로 재발급 |
| Refresh Token | **iOS Keychain / Android Keystore** | 암호화된 하드웨어 보안 저장소 |
| Provider Token (소셜 SDK 토큰) | **저장 안 함** | Wara 토큰 발급 후 즉시 폐기 |

> `AsyncStorage`, `UserDefaults`, `SharedPreferences`에 토큰 저장 금지.

### 6-4. API 요청 시 인증 헤더

```http
Authorization: Bearer {accessToken}
```

### 6-5. 토큰 갱신 흐름

```
API 호출 → 401 응답
  → Keychain에서 refreshToken 읽기
  → POST /auth/refresh { refreshToken }
  → 새 accessToken, refreshToken 수신
  → 메모리에 accessToken 업데이트
  → Keychain에 새 refreshToken 덮어쓰기
  → 실패한 API 재시도

refresh도 401 → 로그아웃 처리 (Keychain 초기화 → 로그인 화면)
```

---

## 7. 보안 고려사항

### 필수

| 항목 | 내용 |
|------|------|
| **토큰 저장소** | Keychain/Keystore 외 저장 금지 |
| **HTTPS 전용** | 모든 API 통신 TLS 1.2+ 강제 |
| **Refresh Token 로테이션** | 이미 구현됨. 토큰 재사용 시 즉시 무효화 |
| **Rate Limiting** | `/token`, `/refresh` 엔드포인트 Throttle 적용 |
| **Provider Token 즉시 폐기** | 서버가 소셜 token 저장 안 함 |
| **Apple nonce** | iOS SDK 흐름에서 replay attack 방어 |
| **Google audience 검증** | `GOOGLE_MOBILE_CLIENT_ID`로 토큰 수신자 검증 필수 |

### 권장 (V1.0 이후)

| 항목 | 내용 | 우선순위 |
|------|------|:--------:|
| **Certificate Pinning** | 중간자 공격 방어 | 중 |
| **Jailbreak/Root 탐지** | Keychain 우회 방어 | 중 |
| **Access Token 만료 단축** | 현재 30분 → 10~15분 권장 | 낮 |
| **Device Binding** | 기기 변경 시 재인증 강제 | 낮 |

### Apple 웹/iOS 특이사항

- iOS SDK 최초 로그인 1회만 `user` 객체(이름, 이메일) 전송. 서버에서 반드시 최초 로그인 시 저장 (이미 구현됨).
- 웹 OAuth용 Apple Service ID는 iOS Bundle ID와 **다른 값**. 각각 Apple Developer Console에서 별도 등록 필요.

---

## 8. 변경 파일 목록

### 백엔드 (`apps/api`)

| 파일 | 변경 | 역할 |
|------|------|------|
| `auth/oauth-policy.service.ts` | 수정 | Google → WEB+MOBILE, Apple → WEB+MOBILE |
| `auth/strategies/interfaces/social.strategy.interface.ts` | 수정 | `authenticateWithProviderToken?` 추가 |
| `auth/strategies/kakao.strategy.ts` | 수정 | `authenticateWithProviderToken` 구현 |
| `auth/strategies/naver.strategy.ts` | 수정 | `authenticateWithProviderToken` 구현 |
| `auth/strategies/google.strategy.ts` | 수정 | `authenticateWithProviderToken` 구현 (id_token 검증) |
| `auth/auth.service.ts` | 수정 | `socialLoginWithProviderToken` 메서드 추가 |
| `auth/auth.controller.ts` | 수정 | `POST :provider/token` 엔드포인트 추가 |
| `auth/dto/mobile-token.dto.ts` | 신규 | `{ providerToken: string }` Zod 스키마 |
| `auth/apple/apple.service.ts` | 수정 | `getAuthorizationUrl` 메서드 추가 |
| `auth/apple/apple.controller.ts` | 수정 | `GET apple/url` 엔드포인트 추가 |
| `auth/apple/apple-callback.dto.ts` | 수정 | `nonce` 필드 추가 (optional) |
| `auth/apple/apple.strategy.ts` | 수정 | nonce 검증 로직 추가 |
| `common/constants/error-codes.ts` | 수정 | `AUTH_PROVIDER_TOKEN_INVALID` 추가 |
| `docs/conventions/error-codes.md` | 수정 | 에러 코드 표 동기화 |

### 환경변수 (`.env`)

```
GOOGLE_MOBILE_CLIENT_ID=...
APPLE_SERVICE_ID=...
APPLE_REDIRECT_URI=...
```

### DB 변경 — 없음

---

## 9. 구현 순서

```
Phase 1 — 백엔드 (2~3일)
  1. error-codes.ts에 AUTH_PROVIDER_TOKEN_INVALID 추가
  2. OauthPolicyService 플랫폼 정책 수정
  3. SocialStrategy 인터페이스 확장
  4. KakaoStrategy.authenticateWithProviderToken 구현
  5. NaverStrategy.authenticateWithProviderToken 구현
  6. GoogleStrategy.authenticateWithProviderToken 구현 (id_token 검증)
  7. AuthService.socialLoginWithProviderToken 구현
  8. AuthController POST :provider/token 엔드포인트 추가
  9. AppleService.getAuthorizationUrl 추가
  10. AppleController GET apple/url 엔드포인트 추가
  11. Apple nonce 보완
  12. 단위 테스트 작성

Phase 2 — 모바일 앱 (Provider별 순차)
  1. Apple Sign In SDK 연동 (nonce 포함)
  2. Kakao SDK 연동
  3. Naver SDK 연동
  4. Google Sign-In SDK 연동
  5. Keychain/Keystore 토큰 저장 레이어
  6. Interceptor: 401 → 자동 refresh → 재시도
  7. 로그아웃 처리

Phase 3 — 통합 테스트
  1. 신규 유저 흐름: 가입 → 프로필 완성
  2. 기존 유저 흐름: 로그인 → 토큰 갱신 → 로그아웃
  3. 만료/재사용 시나리오
  4. 토큰 로테이션 검증
```

---

## 10. 논의 필요 사항

### [A] Kakao + Kakao Talk 분기

`loginWithKakaoTalk()` (카카오톡 앱 설치된 경우) vs `loginWithKakaoAccount()` (웹뷰 로그인) 분기는 모바일 앱 레벨에서 결정. 서버 API는 동일하게 providerToken만 수신.

### [B] Google id_token 검증 방식

두 가지 옵션:
- **Option A**: `GET https://oauth2.googleapis.com/tokeninfo?id_token={idToken}` — 구현 간단, 네트워크 의존
- **Option B**: `google-auth-library` 패키지로 로컬 JWT 검증 — 네트워크 불필요, 패키지 추가

→ 결정 필요.

### [C] 세션 동시성 제한

현재는 기기 수 제한 없이 refresh token 발급. "다른 기기 로그인 알림" 또는 "최대 N개 세션 유지" 정책 필요 시 `refresh_tokens` 테이블의 `deviceInfo` 컬럼 활용 가능 (이미 스키마에 존재).

---

## 11. V1.0 제외 항목

| 항목 | 이유 |
|------|------|
| Certificate Pinning | V1.1+ |
| Biometric 재인증 | V1.1+ |
| Device Binding 기반 세션 제한 | V1.1+ |
| Android Apple Sign In | Apple 정책상 Android 미지원 |
