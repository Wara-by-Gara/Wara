# 21. 거버넌스 & 의사결정 기록

> 코드보다 더 중요할 수 있는 것 — "왜 이렇게 정했나"의 흔적.

---

## 1. SoT(Single Source of Truth) 지도

WARA는 무엇이 어디가 진실인지 명확히 한다.

| 도메인 | SoT 위치 | 그 외 |
|---|---|---|
| API 스펙 | `docs/api/WARA_API_설계_v0.7.md` | 코드는 이걸 구현 |
| DB ERD | `docs/db/WARA_ERD_v0.6.1.md` | drizzle schema는 이걸 따름 |
| 에러 코드 | `docs/conventions/error-codes.md` + `apps/api/src/common/constants/error-codes.ts` | 둘은 동기 유지 |
| 약관 본문 | `docs/legal/*.md` (markdown frontmatter+본문) | DB는 시드로 동기화 |
| 템플릿 미리보기 이미지 | `apps/web/public/template_images/{slug}/` | DB는 slug만 |
| 의사결정 | `docs/decisions/*.md` (ADR) | 코드는 결정의 산물 |

### 충돌 시
- 문서가 옛 것을 가리키면 → 문서 갱신 (코드가 정답)
- 코드가 문서와 다르면 → 어느 쪽이 의도였는지 확인 후 한쪽 갱신

→ "문서 안 보고 코드만 봐도 되는 거 아냐?" — Yes, 단 **결정의 의도**는 코드에 안 남음.

---

## 2. ADR — Architecture Decision Records

`docs/decisions/`에 8개 ADR:
- `mobile-login.md` — 모바일 소셜 로그인 구현 계획
- `photo-location-map.md` — 사진 지도 도메인
- `service-terms-plan.md` — 약관 처리 정책
- `weather-domain.md`, `weather-gstack.md` — 날씨 도메인
- `participants-domain.md` — 참가자 도메인
- `send-logs-domain.md`, `send-logs-gstack.md` — 발송 로그

### ADR 1개의 구조 (`mobile-login.md` 예)
```markdown
# 모바일 소셜 로그인 구현 계획서
> 작성일: 2026-06-01
> 브랜치: feat/mobile-login
> 대상: 백엔드(NestJS), 모바일 앱 (iOS / Android)

## 1. Provider × Platform 지원 매트릭스
[표]

## 2. 현황 분석
### 웹 로그인 현황 (변경 없음)
### 모바일에서 달라지는 것

## 3. 구현 계획
...

## 4. 트레이드오프
...
```

### ADR을 언제 쓰나
- 되돌릴 수 없거나 비용이 큰 결정
- 여러 옵션 사이의 선택
- 외부 정책 (예: 카카오 비즈앱 정책)
- "왜 이게 이렇게 됐지?"가 6개월 후 떠오를 가능성

### 작성 원칙
- **결정 시점에 작성** (사후 작성은 합리화로 변질)
- **선택지 + 트레이드오프** 명시 (안 고른 옵션도 적기)
- **결정 후엔 immutable** (수정 대신 새 ADR로 supersede)

---

## 3. 카카오 비즈앱 정책 — 실제 결정 예

### 정책
- Web/iOS: 카카오·네이버·구글·애플
- Android: 카카오·네이버·구글 (애플 **제외**)

### 왜?
- Android에서 애플 로그인은 사용자 경험 매우 나쁨 (앱 외부 브라우저 + 첫 사용 시 Apple ID 입력)
- 정책상 강제되지 않음
- → 정책 단순화 + UX 향상을 위해 제외

### 코드에 반영
- `apps/api/src/auth/oauth-policy.service.ts`가 platform × provider 매트릭스 검증
- 위반 시 즉시 400

### 문서화
- Memory에 저장 (`project_provider_matrix.md`)
- ADR `mobile-login.md`에 매트릭스 표
- 루트 CLAUDE.md에 "V1.0 소셜 로그인 정책 위반: ..." 규칙 항목

→ **3중 안전망**: 문서 + 메모리 + 코드 검증.

---

## 4. error-codes 표 동기화

### 규칙 (루트 CLAUDE.md)
- 새 기능 → 에러는 반드시 `error-codes.ts`에 추가 후 사용
- 에러 메시지 문자열 직접 사용 금지

### 추가 절차
1. `apps/api/src/common/constants/error-codes.ts`에 상수 추가
2. `docs/conventions/error-codes.md` 표에 항목 추가
3. 서비스에서 `ErrorCode.XXX`로 사용
4. (선택) 프론트 `ERROR_MESSAGES`에 사용자용 문구

### 표가 코드와 어긋났을 때
- `error-codes.ts`에는 있는데 표에 없음 → 표 갱신
- 표에는 있는데 `error-codes.ts`에 없음 → 누락된 추가 (또는 표에서 제거)
- HTTP status가 두 곳에서 다름 → 코드 따라감 (코드가 진실)

---

## 5. todo.md — 비공식 작업 트래커

WARA 루트에 `todo.md` (git X — `.gitignore` 아닌 인덱스 미포함).

### 형식
```markdown
# WARA 작업 계획 — 2026-06-13

## 🎯 오늘 작업
1. 외부 E2E 사전결함 진단 — `fix/e2e-legacy-failures`
2. drizzle migrate/seed CI 자동 검증 — `chore/ci-migrate-seed-check`

## 🟣 보류
- Place log 모임 그룹화 (BE + FE)
- 약관 본문 보완
- ...
```

### 왜 이게 의미가 있나
- Linear/Jira 같은 외부 도구 없이 1인 개발이라면 충분
- 매일 시작·종료 시 갱신 → 컨텍스트 회복 빠름
- Claude도 세션 시작 때 이걸 읽고 작업 우선순위 파악

### 한계
- 팀 협업엔 부족 (히스토리·할당·라벨링)
- 검색·필터 한계

---

## 6. CI 보안 검사

`.github/workflows/`:
- `ci.yml` — lint / typecheck / test (모든 PR)
- `codeql.yml` — 코드 보안 분석 (XSS, injection 등)
- `secret-scan.yml` — 시크릿 누출 감지 (API 키, 비밀번호 commit)
- `deploy.yml` — main push 시 배포
- `auto-assign.yml` — PR 리뷰어 자동 지정

### codeql
GitHub 제공 정적 분석. PR 단계에서 의심스러운 패턴 차단.

### secret-scan
- `.env`, `secrets.json` 같은 파일이 실수로 commit되면 잡음
- 주요 클라우드 API 키 패턴 매칭

### 추가 강화 가능 (todo)
- `db:migrate && db:seed` 자동 검증 워크플로 (drizzle silent fail 재발 방지)

---

## 7. PR 리뷰 표준

### 머지 전 체크 (루트 CLAUDE.md `Verify`)
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### PR 본문 권장
- 변경 요약 (1~3 bullet)
- 테스트 plan (체크리스트)
- 영향 범위 (어느 도메인이 바뀜)

### Co-Authored-By 금지
WARA 메모리 규칙: Claude 같은 LLM이 작성에 관여해도 Co-Authored-By 라인 넣지 않음.

---

## 8. 기록의 계층

```
1. ADR (docs/decisions/)         — 결정의 "왜" — 영구
2. CLAUDE.md                     — 행동 규칙 — 영구, 업데이트 가능
3. PR 본문                       — 변경의 "왜" — 영구 (GitHub)
4. 커밋 메시지                   — 변경의 "무엇" — 영구
5. todo.md                       — 단기 우선순위 — 휘발
6. Memory                        — Claude 학습 — 사용자 환경
```

각 층의 책임이 다르고 라이프사이클이 다름.

---

## 9. 흔한 함정

### ADR 없이 큰 결정
6개월 후 "왜 RDS 안 쓰고 EC2에 postgres 직접?"이라는 질문에 답 못 함.
→ 결정 시점에 짧게라도 ADR.

### 문서 vs 코드 어긋남 방치
"문서가 옛 거니까 코드 봐" → 새 멤버 학습 곡선 ↑.
→ 어긋남 발견 즉시 한쪽 갱신.

### 카카오 정책 같은 외부 제약을 코드에만
정책이 변경됐을 때 코드 검색만으로 모두 추적 어려움.
→ ADR + CLAUDE.md + 코드 3중 명시.

### 결정 이력 다 commit 메시지에
commit은 단위가 작고 분산됨. 큰 그림은 ADR로.

### todo.md를 영구 기록처럼
완료 항목 누적 → 길어짐 → 안 봄. 짧게 유지, 완료는 PR 본문/ADR로 흡수.

---

## 10. 체크리스트

- [ ] SoT 6가지 위치를 댈 수 있다
- [ ] ADR이 무엇이고 언제 쓰는지 안다
- [ ] 카카오 정책이 3곳(ADR/CLAUDE/코드)에 기록된 의도를 안다
- [ ] error-codes의 표↔코드 동기화 절차를 안다
- [ ] CI 워크플로 5개의 역할을 안다
- [ ] 기록 6층(ADR/CLAUDE/PR/commit/todo/memory)의 역할 차이를 안다

→ 끝. [README](./README.md)로 돌아가 다음 주제 또는 심화 학습.
