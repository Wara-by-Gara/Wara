---
name: test-review
description: >
  Use this skill to review unit/integration tests and API edge case coverage.
  Triggers include: 테스트 점검, 단위 테스트, 통합 테스트, 엣지케이스, 잘못된 요청값, 권한 없는 접근,
  중복 요청, 동시 요청, 삭제/마감/비공개 상태 접근, test coverage, spec 파일 리뷰.
  Always verify that each edge case has a corresponding test before flagging as missing.
---

# Test Review Skill (NestJS / Jest / WARA)

테스트가 실제 공격/실패 시나리오를 커버하는지 검증한다.
"테스트 있음"과 "의미 있는 테스트 있음"은 다르다 — 실제 비즈니스 규칙을 검증하는지 확인한다.

---

## 원칙

- 테스트 파일과 실제 Service/Controller 코드를 나란히 읽어 커버 여부를 판단
- Happy path만 있고 엣지케이스가 없는 테스트는 불완전으로 간주
- Mock 과다 사용(DB mock, 모든 의존성 mock)은 false confidence를 만든다 — 실제 로직을 테스트하는지 확인
- 각 도메인별 핵심 엣지케이스 목록을 기준으로 누락 여부를 체크

---

## Workflow

### Phase 1 — 테스트 파일 현황 스캔

```bash
# spec 파일 목록
find apps/api/src -name "*.spec.ts" | sort

# 테스트 케이스 수
grep -c "it(\|test(" apps/api/src/**/*.spec.ts
```

각 도메인별 spec 파일 존재 여부 및 커버 범위 확인.

---

### Phase 2 — 엣지케이스 커버리지 체크

**WARA 핵심 엣지케이스 목록:**

#### 인증/인가
- [ ] 만료된 JWT로 요청 → 401
- [ ] 위조된 JWT(서명 불일치)로 요청 → 401
- [ ] state 없는 OAuth callback → 401
- [ ] 차단된 유저의 초대장 접근 → 403

#### 리소스 접근
- [ ] 존재하지 않는 ID로 조회 → 404
- [ ] 다른 초대장 리소스 ID로 접근(IDOR) → 404
- [ ] 참가자가 아닌 유저의 초대장 리소스 접근 → 403
- [ ] HOST 전용 엔드포인트에 GUEST 접근 → 403

#### 상태 기반 접근
- [ ] 마감(closed)된 초대장에 참가 요청 → 422
- [ ] 삭제(deletedAt)된 리소스 조회 → 404
- [ ] absent RSVP 상태에서 금지된 작업 → 403

#### 중복 / 동시 요청
- [ ] 이미 참가한 초대장에 재참가 → 409
- [ ] 이미 좋아요한 사진에 좋아요 → 409
- [ ] 동시 참가 요청(race condition) → unique constraint가 한 번만 허용하는지

#### 입력값 검증
- [ ] 필수 필드 누락 요청 → 400
- [ ] ULID 형식이 아닌 path param → 400
- [ ] 허용되지 않는 추가 필드 포함 요청 → 400

---

### Phase 3 — 테스트 품질 검토

각 spec 파일에 대해 확인:

```bash
grep -n "expect\|toBe\|toThrow\|rejects" apps/api/src/**/*.spec.ts
```

**체크 항목:**

| 문제 | 확인 방법 |
|------|-----------|
| expect 없는 테스트 | `it(...)` 블록에 `expect` 없는 경우 |
| 모든 mock → 실 로직 미검증 | `jest.fn().mockResolvedValue()` 남발로 분기 로직 미실행 |
| 에러 케이스 미검증 | `rejects.toThrow` 없는 예외 발생 코드 |
| 상태 검증 없음 | 함수 호출 확인만 하고 실제 반환값/DB 상태 미확인 |

---

### Phase 4 — 누락된 테스트 식별

Service 메서드별로 다음을 확인:
1. 해당 메서드의 spec에 happy path + 주요 에러 케이스가 있는가?
2. Guard 로직(ParticipantGuard, HostGuard, BlocklistGuard)이 Controller spec에서 테스트됐는가?
3. DTO 검증 실패 케이스(Zod schema)가 테스트됐는가?

---

## 출력 형식

```
## 테스트 점검 결과

### 현황 요약
| 도메인 | spec 파일 | 테스트 케이스 수 | 엣지케이스 커버율 |

### 누락된 엣지케이스
| # | 도메인 | 시나리오 | 예상 결과 | 우선순위 |

### 품질 이슈
| # | 파일 | 문제 | 내용 |

### 양호
| 도메인 | 근거 |
```
