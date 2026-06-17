# 05. 인증 시스템

> "사용자가 카카오로 로그인했다"는 한 문장 뒤에 OAuth 코드 교환, JWT 발급, refresh rotation, CSRF 방어가 다 들어있다.

---

## 1. 큰 그림

WARA의 인증은 **3개 축**이 얽혀 있다.

1. **OAuth (소셜 로그인)** — 카카오·네이버·구글·애플 (Web/iOS), Android는 애플 제외
2. **JWT (서버 발급 토큰)** — access(쿠키 or Bearer) + refresh(쿠키 + DB)
3. **CSRF 방어** — 쿠키 인증 변경 요청에 Origin/Referer 검증

→ 클라이언트 종류별로 토큰 전달 방식이 다름:
- **Web**: 쿠키 (`HttpOnly`)
- **Mobile**: `Authorization: Bearer`

---

## 2. OAuth 흐름 (카카오 예)

### Web (서버 콜백)

```
[1] 클라이언트 → GET /auth/kakao/url?platform=WEB
                ↑ state(JWT) + url 반환

[2] 사용자 → 카카오 로그인 페이지에서 동의
[3] 카카오 → redirect GET /auth/kakao/callback?code=...&state=...
[4] 백엔드 → state 검증 → code 교환 → 카카오 user info 조회
            → DB upsert → JWT 발급 → 쿠키 set → /로 redirect
```

### Mobile (클라이언트가 토큰 받아 백엔드로)

```
[1] 앱이 카카오 SDK로 직접 로그인 → providerToken 획득
[2] 앱 → POST /auth/kakao/token { providerToken }
[3] 백엔드 → providerToken으로 카카오 user info 조회
            → DB upsert → JWT 발급 → JSON 응답
```

→ 코드는 [13. 로그인 워크스루](./13-walkthrough-login.md)에서 줄 단위로.

---

## 3. state란 (CSRF 방어 코드)

OAuth flow의 핵심: redirect URL에 `state` 파라미터를 끼워 위조를 막는다.

`auth.service.ts:28`:
```ts
generateState(): string {
  return this.jwtService.sign(
    { nonce: randomUUID() },
    { secret: 'JWT_ACCESS_SECRET', expiresIn: '10m' },
  );
}

verifyState(state: string): void {
  try {
    this.jwtService.verify(state, { secret: 'JWT_ACCESS_SECRET' });
  } catch {
    throw new UnauthorizedException({ code: ErrorCode.AUTH_INVALID_STATE });
  }
}
```

→ state는 자체 JWT. 위조 어렵고 만료 10분. **세션 스토리지 없이도 위조 검증 가능**한 게 장점.

### `link` state (계정 연결용)
이미 로그인된 사용자가 "구글 계정 추가 연결" 누르면 → state에 `userId + link: true` 포함.
콜백에서 `isLinkState()`로 분기 → 일반 로그인 흐름 대신 link 처리.

---

## 4. JWT 발급·검증

### Access Token
- HS256 (대칭키)
- secret: `JWT_ACCESS_SECRET` (최소 32바이트, `main.ts:27`에서 startup 검증)
- 만료: 30분 (`JWT_ACCESS_EXPIRES_IN=1800`)
- payload: `{ sub: userId, role }`

`auth.module.ts:33`:
```ts
JwtModule.registerAsync({
  global: true,
  inject: [ConfigService],
  useFactory: (config) => ({
    secret: config.getOrThrow('JWT_ACCESS_SECRET'),
    signOptions: { expiresIn: Number(config.get('JWT_ACCESS_EXPIRES_IN', 1800)), algorithm: 'HS256' },
    verifyOptions: { algorithms: ['HS256'] },
  }),
}),
```

### Refresh Token
- 더 긴 만료 (14일 = 1209600초)
- 발급 시 SHA-256 해시해서 Redis에 저장 (raw 보관 X)
- 사용 시 raw 해시해서 Redis 검색 → 일치하면 새 access·refresh 발급 + 옛 refresh 제거 (**rotation**)
- 이미 revoke된 refresh가 재사용되면 `SUSPICIOUS_REFRESH` → 해당 user의 모든 토큰 revoke

`auth.service.ts:92`:
```ts
private hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
```

---

## 5. 쿠키 vs Bearer

`auth.controller.ts:41`:
```ts
private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProd = this.configService.get('NODE_ENV') === 'production';
  const base = { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };

  res.cookie('accessToken',  accessToken,  { ...base, maxAge: accessMaxAge });
  res.cookie('refreshToken', refreshToken, { ...base, maxAge: refreshMaxAge });
  res.cookie('is_logged_in', '1', { httpOnly: false, ...rest });  // JS에서 읽을 수 있는 boolean
}
```

### 쿠키 옵션
- **`HttpOnly`**: JS에서 못 읽음 → XSS로 탈취 어려움
- **`Secure`**: HTTPS에서만 전송 (운영 only)
- **`SameSite=Lax`**: 외부 사이트가 POST로 보내도 쿠키 안 붙음 (CSRF 방어 1차)
- **`is_logged_in`**: HttpOnly=false. **단순 로그인 여부**만 JS에서 확인용 (토큰 자체는 노출 X)

### Mobile은 왜 Bearer인가
- React Native에서 쿠키 관리가 까다로움 (SecureStore에 직접 저장이 더 명확)
- `/auth/:provider/token`, `/auth/refresh` body에 refresh token 받음 (`auth.controller.ts:186`)

> **알려진 보안 리스크**: `apps/web`의 `apiClient`가 `document.cookie`에서 accessToken을 읽어 Bearer로 보낸다. → XSS 위험. 장기적으로 HttpOnly로 전환 예정 (`apps/web/CLAUDE.md`).

---

## 6. CSRF 방어 (Referer 검증)

`main.ts:106`:
```ts
const allowedOrigin = process.env.FRONTEND_URL!.replace(/\/$/, '');
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next();

  const cookies = req.cookies as Record<string, string> | undefined;
  const hasCookieAuth = !!cookies?.accessToken || !!cookies?.refreshToken;
  if (!hasCookieAuth) return next();   // 모바일(Bearer)는 면제

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const isAllowed =
    origin === allowedOrigin || referer?.startsWith(allowedOrigin) === true;
  if (!isAllowed) {
    return next(new ForbiddenException({ code: ErrorCode.CSRF_INVALID_ORIGIN }));
  }
  next();
});
```

### 왜 변경 요청만?
- GET은 OAuth callback 등 외부 redirect에서 호출 → 검증하면 깨짐
- 변경 작업(POST/PUT/PATCH/DELETE)이 CSRF의 실제 위험

### Bearer 요청은 왜 면제?
- 모바일이 쿠키 없이 Bearer만 보냄 → Origin 검증 어려움
- CSRF는 본질적으로 "브라우저 자동 쿠키 첨부" 문제. Bearer는 JS가 명시적으로 헤더에 넣으므로 다른 사이트가 위조 못 함.

### 알려진 보강 포인트
`referer?.startsWith(allowedOrigin)` 은 `https://www.wara.kr.evil.com`도 매칭됨. → `new URL(referer).origin === allowedOrigin`으로 바꿔야 정확. (todo의 보류 항목)

---

## 7. Global Guard 체인

`auth.module.ts:67`:
```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
{ provide: APP_GUARD, useClass: RequiredTermsGuard },
```

### JwtAuthGuard
- 쿠키(`accessToken`) 또는 `Authorization: Bearer` 헤더에서 토큰 추출
- HS256 검증 → payload를 `req.user`에 주입
- `@Public()` 데코레이터면 스킵

### RolesGuard
- `@Roles('host')` 같은 메서드 데코레이터로 권한 비교

### RequiredTermsGuard
- 약관 동의 안 한 유저가 변경 요청 시 차단 (`TERMS_AGREEMENT_REQUIRED`)
- 약관 동의 페이지로 보내는 흐름

### 도메인 가드
- **HostGuard**: 초대장 호스트만 접근 가능
- **ParticipantGuard**: 초대장 참가자만 접근
- **BlocklistGuard**: 호스트가 차단한 사용자 차단 (`INVITATION_ACCESS_REVOKED`)

→ 가드는 메서드 단위로 `@UseGuards(HostGuard)`로 붙임. AuthModule이 export해서 다른 모듈도 사용.

---

## 8. 토큰 회전(Refresh Rotation)

```
1. /auth/refresh 요청 (refresh token 첨부)
2. raw → sha256 → Redis에서 검색
3. 일치하면:
   - 옛 refresh는 Redis에서 제거 (revoke)
   - 새 access + 새 refresh 발급
   - 새 refresh 해시 → Redis 저장
4. 일치하지 않지만 과거에 발급된 흔적이 있으면 (의심):
   - 해당 user의 모든 refresh revoke
   - SUSPICIOUS_REFRESH 응답 → 클라이언트 강제 로그아웃
```

→ refresh가 새어나가도 한 번만 재사용되면 다음 회전부터는 무효화됨.

---

## 9. 계정 연결·병합 (link / merge)

같은 사용자가 카카오·구글 둘 다 연결하려는 시나리오:

### Case A — 새 소셜이 어디에도 연결 안 됨
- `socialAccounts`에 그냥 추가

### Case B — 새 소셜이 **다른 wara 계정**에 이미 연결됨
- `SOCIAL_ALREADY_LINKED` + `mergeToken` 반환
- 클라이언트가 merge 동의 페이지로
- merge token 검증 후 두 계정 병합 (한쪽은 soft delete)

`auth.controller.ts:141` `handleLinkCallback()`가 그 흐름.

---

## 10. 회원 탈퇴

조건:
- 진행 중인 active 초대장의 호스트가 아니어야 함 → 아니면 `USER_HAS_HOSTED_INVITATIONS`로 차단
- 호스트 권한 이전 후 다시 시도

탈퇴 처리:
- `users.deletedAt`에 timestamp set (soft delete)
- `withdrawalReason`, `withdrawalDetail` 기록
- Refresh token 전부 revoke
- 소셜 연결 정리

---

## 11. 마지막 소셜 lockout 방지

소셜 1개만 남았는데 그걸 해제하려 하면 → 로그인 수단이 사라짐.
→ `USER_SOCIAL_LAST_LINKED` 에러로 차단.

---

## 12. 흔한 함정

### secret을 코드에 하드코딩
`main.ts:23`이 부팅 시 환경변수 검증 — 누락이면 즉시 종료. **fallback secret 사용 금지**.

### state를 세션에 저장
WARA는 state를 JWT로 만들어 stateless로. → 여러 서버 인스턴스 간 세션 공유 불필요.

### refresh token을 raw로 DB 저장
탈취 시 즉시 악용 가능. → sha-256 hash로 저장.

### SameSite=None 사용
크로스 사이트 자동 쿠키 첨부 → CSRF에 무방비. WARA는 Lax 고정.

### Apple Private Key를 코드/.env에 보관
todo의 "Apple private key 시크릿 매니저 이관"이 그 항목.

---

## 13. 체크리스트

- [ ] OAuth flow에서 state가 왜 필요한지 설명 가능
- [ ] HS256 access token / refresh token rotation 흐름을 그릴 수 있다
- [ ] 쿠키 옵션 4개(HttpOnly/Secure/SameSite/Path)의 의미를 안다
- [ ] CSRF 검증이 Bearer 요청을 왜 면제하는지 안다
- [ ] HostGuard / ParticipantGuard / BlocklistGuard의 역할 차이를 안다
- [ ] 탈퇴 시 active 호스트 차단 규칙을 안다

→ 다음: [06. 프론트엔드 스택](./06-frontend-stack.md)
