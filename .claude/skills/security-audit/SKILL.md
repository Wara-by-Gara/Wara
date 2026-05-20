---
name: security-audit
description: >
  Use this skill to perform a thorough security audit of the current branch from an attacker's perspective.
  Triggers include: 보안 점검, 취약점 찾아줘, 해커 시점, 보안 감사, security review, 해킹 시도,
  인증/인가 점검, IDOR 점검, 보안 취약점, 보완 사항 확인.
  Always verify each finding with actual code before fixing — never fix without proof.
---

# Security Audit Skill (NestJS / WARA)

해커 시점에서 코드베이스를 체계적으로 분석하고, **코드로 증명된 취약점만** 수정한다.
추측으로 수정하지 않는다. 발견 → 검증 → 수정 순서를 반드시 지킨다.

---

## 원칙

- 수정 전 반드시 코드로 재현 경로를 증명한다
- False positive를 보고하지 않는다 — 실제 공격 가능한 것만 수정한다
- 각 취약점마다 "공격 시나리오"를 한 줄로 명시한다
- 수정 후 `pnpm typecheck` 통과를 확인한다

---

## Workflow

### Phase 1 — 인증/인가 스캔

모든 컨트롤러의 Guard 현황을 한눈에 파악한다.

```bash
grep -rn "UseGuards\|@Public\|@Get\|@Post\|@Patch\|@Delete\|@Put" \
  apps/api/src/**/*.controller.ts
```

**체크 항목:**

| 공격 벡터 | 확인 방법 |
|-----------|-----------|
| Guard 없는 엔드포인트 | `@Get/@Post` 위에 `@UseGuards` 없는 것 탐색 |
| `@Public()` 과다 적용 | 인증 불필요한 라우트만 `@Public`인지 확인 |
| Guard 순서 오류 | `JwtAuth → Blocklist → Participant → Host` 순서 확인 |
| 차단된 유저 접근 | `BlocklistGuard`가 join/참가 라우트에 적용됐는지 확인 |
| OAuth state 검증 | callback DTO에서 `state`가 `optional()`인지 확인 |
| Rate Limit 부재 | 인증 엔드포인트에 `@Throttle` 없는 것 확인 |
| 외부 API 프록시 | 카카오/네이버 등 외부 API 호출 엔드포인트에 전용 throttle 확인 |

---

### Phase 2 — IDOR 스캔

리소스 조회 시 소속 검증 누락을 탐색한다.

**WARA 패턴:** 초대장(invitationId) 소속 검증 없이 ID만으로 조회하는 경우.

```bash
# Repository에서 단일 ID로만 조회하는 메서드 탐색
grep -n "findById\|findOne\|findByPk" apps/api/src/**/*.repository.ts
```

각 메서드에 대해 확인:
1. 호출하는 Service에서 `invitationId` 소속 검증을 하는가?
2. 없다면 다른 리소스의 ID로 호출 가능한지 시뮬레이션

**공격 시나리오 템플릿:**
> A 초대장 참가자가 B 초대장 리소스 ID를 알고 있을 때, `GET /invitations/A_ID/resource/B_RESOURCE_ID`로 B의 데이터를 조회할 수 있는가?

---

### Phase 3 — 비즈니스 로직 취약점

Guard나 validation으로 못 막는 흐름상 결함을 탐색한다.

**체크 항목:**

| 취약점 | 확인 포인트 |
|--------|-------------|
| 차단된 유저 재가입 | `join` 서비스에서 `blocklistRepository.isBlocked` 호출 여부 |
| 탈퇴 후 토큰 유효 | `deleteMe`에서 `revokeAllRefreshTokens` 호출 여부 |
| 레이스 컨디션 | check-then-act 패턴 (findById → create) 사이 DB unique constraint 여부 |
| 소유권 검증 | PATCH/DELETE에서 `viewer.id !== targetId` 검증 여부 |
| 상태 전이 오용 | 마감/비공개 리소스에 접근 가능한지 확인 |
| 예제 모듈 노출 | `app.module.ts`에 example/reference 모듈이 등록됐는지 확인 |

---

### Phase 4 — 입력값 검증

**체크 항목:**

| 취약점 | 확인 방법 |
|--------|-----------|
| 정규식 문자셋 오류 | ULID 정규식: `[0-9A-HJKMNP-TV-Z]` (I, L, O, U 제외) |
| CRLF 미필터 | 헤더/로그에 삽입되는 값에 `\r\n` 필터 여부 |
| 길이 제한 부재 | echo되는 헤더(x-request-id 등) 최대 길이 제한 여부 |
| Content-Disposition | 파일명 추출 시 특수문자 sanitize 여부 |
| DTO optional 남용 | 보안상 필수 필드(OAuth state 등)가 optional인지 확인 |

---

### Phase 5 — 설정/인프라

```bash
# helmet 설치 여부
grep "helmet" apps/api/src/main.ts apps/api/package.json

# CORS wildcard 위험
grep -n "origin\|cors" apps/api/src/main.ts

# stack trace 응답 노출
grep -n "stack\|stacktrace" apps/api/src/common/filters/*.ts

# WebSocket 인증
grep -n "handleConnection\|verifyAsync" apps/api/src/**/*.gateway.ts
```

**체크 항목:**

| 항목 | 기준 |
|------|------|
| helmet | `app.use(helmet())` main.ts에 있는가 |
| CORS origin | 와일드카드 `*` 아닌 명시적 origin인가 |
| stack trace | 500 응답 JSON에 stack이 포함되지 않는가 |
| WebSocket | 연결 시 JWT 검증 후 실패하면 `client.disconnect()` 하는가 |
| 환경변수 | 필수 보안 변수 누락 시 서버 시작 실패하는가 |

---

### Phase 6 — 검증 및 수정

발견한 항목마다 아래 형식으로 정리한 후 수정한다.

```
## [취약점 이름]

**공격 시나리오:** (한 줄로)
**증거:** (파일명:라인번호) + 코드 근거
**수정:** (변경 내용)
```

수정 후:
```bash
cd apps/api && pnpm typecheck
```

---

### Phase 7 — 최종 체크리스트 출력

`checklist.md`를 기준으로 각 항목 ✅ / ❌ / ⚠️ 로 최종 상태를 출력한다.

---

## 출력 형식

```
## [도메인명] 보안 감사 결과

### 발견된 취약점

| # | 심각도 | 유형 | 설명 | 파일 |
|---|:------:|------|------|------|
| 1 | 🔴 CRITICAL | 인가 | ... | ... |
| 2 | 🟡 MEDIUM | IDOR | ... | ... |

### 수정 완료

| # | 취약점 | 수정 내용 | 검증 |
|---|--------|-----------|:----:|
| 1 | ... | ... | ✅ |

### False Positive (수정 불필요)

| 항목 | 이유 |
|------|------|
| ... | (코드 근거) |
```
