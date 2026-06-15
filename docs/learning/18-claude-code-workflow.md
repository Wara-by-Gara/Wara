# 18. Claude Code로 이 프로젝트 작업하기

> Claude Code(LLM 어시스턴트)를 효율적으로 쓰기 위한 WARA 프로젝트의 설정과 관습.

---

## 1. Claude Code가 뭔지 30초 요약

- **CLI 어시스턴트**: 터미널에서 자연어로 대화하며 코드를 읽고 쓴다
- **파일 접근**: Read/Write/Edit 도구로 직접 파일 조작
- **명령 실행**: Bash/PowerShell로 빌드·테스트·git 실행
- **컨텍스트 보존**: `CLAUDE.md`, 메모리, plan, task로 세션·프로젝트 정보 유지

→ "코드 짜는 동료"처럼 다루되, **컨텍스트를 명확히 줘야** 잘 동작.

---

## 2. 핵심 구조 — 3층의 컨텍스트

```
1) CLAUDE.md (프로젝트 규칙)        — 코드와 함께 commit, 모든 세션 자동 로드
2) Memory (~/.claude/.../memory)    — 사용자 환경 학습, 세션 간 지속
3) Conversation (현재 세션)         — plan, task, 대화 히스토리
```

세 층의 우선순위: **현재 사용자 발화 > CLAUDE.md > Memory**.

---

## 3. `CLAUDE.md` — 프로젝트 규칙 (WARA의 핵심 자산)

### 위치 6곳 (WARA)
```
CLAUDE.md                          # 루트 — 전 프로젝트 행동 원칙
apps/api/CLAUDE.md                 # 백엔드 규칙 (3-tier, 에러 코드)
apps/web/CLAUDE.md                 # 프론트 규칙 (Tailwind, React Query 패턴)
apps/mobile/CLAUDE.md              # 모바일 규칙
apps/api/drizzle/CLAUDE.md         # Drizzle 마이그레이션 규칙
apps/api/src/photos/CLAUDE.md      # 사진 도메인 디테일
```

### 자동 합성
세션 시작 시 Claude는 **현재 작업 경로의 모든 상위 CLAUDE.md를 자동으로 읽음**.
예: `apps/api/src/photos/` 작업 → 위 6개 중 4개가 자동 로드 (루트 + api + drizzle + photos).

### WARA 루트 CLAUDE.md 구조 (참고)
```markdown
# 1. 코딩 전에 생각하기  — 가정·해석·트레이드오프 표면화
# 2. 단순하게            — 추측성 코드 금지
# 3. 필요한 부분만 수정   — 인접 코드·dead code 건드리지 말 것
# 4. 목표 기준으로 실행   — 성공 기준 정하고 검증
# 5. LLM Output 규칙      — 불명확하면 질문, 다단계는 계획 먼저
## Always                — DB 변경 시 migration, 멱등성 키, soft delete
## Never                 — env 하드코딩, console.log, raw SQL, any 타입
## Verify                — pnpm lint && typecheck && test && build
## Scope                 — 현재 구현 범위 명시 (V1 기준)
## Refs                  — @docs/api/, @docs/db/, @docs/conventions/
```

→ 이 형식이 **Claude의 행동 가이드**. 사용자가 매번 "no any 타입 쓰지 마"라고 안 해도 됨.

### 좋은 CLAUDE.md의 조건
- **체크 가능한 규칙** (모호한 "잘 짜라"보다 "any 타입 금지")
- **Why 포함** (`Verify` 섹션처럼 명령까지 명시)
- **Scope 명확** (이 프로젝트에 무엇이 포함되고 무엇이 안 들어가는지)
- **결정 기록 링크** (`@docs/decisions/`)

---

## 4. Memory — 세션 간 지속

위치: `C:\Users\alstj\.claude\projects\<프로젝트>\memory\`

### 4가지 종류
| type | 무엇을 저장 | 예 |
|---|---|---|
| **user** | 사용자 역할·환경·선호 | "user is a 시니어 풀스택, 자체 라이브러리 안 쓰는 걸 선호" |
| **feedback** | 행동 교정 사항 | "Co-Authored-By 라인 금지", "force push 금지" |
| **project** | 진행 상황·정책·결정 | "회원 탈퇴 정책: active host는 차단" |
| **reference** | 외부 시스템 위치 | "Linear 프로젝트 INGEST에 버그 추적" |

### MEMORY.md (인덱스)
모든 메모리 파일의 한 줄 요약 목록. Claude가 자동 로드.

WARA의 일부 메모리 예 (실제):
```
- 소셜 로그인 Provider×Platform 매트릭스 — Web/iOS: 카카오·네이버·구글·애플, Android: 애플 제외
- 마이그레이션 언급 불필요 — 설계 단계에서 migration 실행 언급 금지
- Co-Authored-By 제거 — 커밋 메시지에 Co-Authored-By 라인 포함 금지
- force push 금지 — 공유 브랜치에 force push 절대 금지
- 약관 SoT는 docs/legal/*.md — frontmatter+본문 SoT, 시드 onConflictDoUpdate로 자동 동기화
```

### 메모리는 언제 쓸까
- 사용자가 같은 교정을 두 번 하면 → 메모리에 저장
- "기억해줘" 명시 요청 → 즉시 저장
- 외부 시스템(콘솔, Slack 채널) 참조 → reference로

### 메모리에 저장하면 안 되는 것
- 코드에서 derive 가능한 사실 (파일 경로, 함수 시그니처)
- git history로 알 수 있는 변경 사항
- CLAUDE.md에 이미 있는 규칙
- 이번 세션의 임시 상태

---

## 5. Plan / Task — 세션 안의 작업 관리

### Plan (계획 단계)
다단계 작업 시작 전 계획을 제시.
- **언제**: "리팩터링", "도메인 추가", "복잡한 디버깅"
- **예**: "도메인 폴더 만들고 → 스키마 추가 → 마이그레이션 → 컨트롤러 → 서비스 → 테스트"

CLAUDE.md 루트 규칙: "다단계 작업이면 1. 계획 제시 → 2. 사용자 확인 → 3. 구현".

### Task (체크리스트)
긴 작업은 task로 쪼개서 진행 상황 트래킹.
- `in_progress` / `completed` 상태 관리
- 사용자에게 진척이 보임

### 언제 task를 만들까
- 3개 이상의 독립 단계
- 30분 이상 걸릴 작업
- 시작 전 큰 그림이 필요한 작업

### 언제 안 만들까
- "이 함수 한 줄 고쳐" 같은 단발성
- 정보 수집만 필요한 단순 조회

---

## 6. 슬래시 명령 — 자주 쓰는 매크로

### 빌트인
| 명령 | 용도 |
|---|---|
| `/help` | 도움말 |
| `/clear` | 대화 초기화 |
| `/config` | 설정 변경 (테마, 모델 등) |
| `/init` | 새 프로젝트에 `CLAUDE.md` 생성 |

### WARA에서 활성된 스킬 (직접 호출 가능)
| 명령 | 용도 |
|---|---|
| `/api-design` | NestJS API 설계 |
| `/drizzle-schema` | Drizzle 스키마 설계 |
| `/review` | PR 리뷰 |
| `/security-review` | 보안 검토 |
| `/simplify` | 코드 단순화 |
| `/loop` | 반복 작업 |
| `/schedule` | 예약 실행 |

→ Skill 만드는 방법은 [19. Skill 만들기](./19-skill-authoring.md).

---

## 7. 효율적인 프롬프트 패턴

### ❌ 나쁜 예
> "사진 좀 어떻게 해줘"

→ 너무 모호. Claude가 추측 → 엉뚱한 방향으로 작업.

### ✅ 좋은 예
> "`apps/api/src/photos/photos.service.ts:42` 의 `uploadPhoto` 메서드에서 S3 PUT 실패 시 DB row가 남아 orphan이 됨. 트랜잭션으로 묶거나 보상 trx 추가해서 정합성 보장."

→ 파일 경로, 줄 번호, 문제, 해결 방향이 명확.

### 좋은 프롬프트의 4요소
1. **위치**: `path:line` 형식
2. **현재 상황**: 무엇이 어떻게 동작 중
3. **문제 / 목표**: 무엇을 바꾸고 싶나
4. **제약**: 건드리면 안 되는 부분, 선호하는 방식

---

## 8. 세션 시작 전 체크리스트

새 세션 켤 때:
1. `git status` 확인 (이전 작업 정리됐는지)
2. `git pull` (브랜치 최신화) — WARA의 develop이 그렇게 뒤져 있던 적이 있음
3. todo.md 또는 진행 중 PR 살펴보기
4. CLAUDE.md 신규 사항 있는지 (다른 사람이 업데이트했을 수 있음)

Claude에게 첫 질문이 막연하면:
> "지금 develop 브랜치 상태 정리해줘. 작업해야 할 게 뭔지 알려줘."

→ Claude가 `git log`, todo.md, 미커밋 변경을 살펴 요약.

---

## 9. 권한 모드와 자동 실행

Claude는 도구 실행 시 사용자 승인을 받음. 모드:
- **수동 승인** (기본): 매 도구 실행마다 묻기
- **자동 승인** (특정 패턴): 신뢰하는 명령은 자동 (예: `git status`, `pnpm typecheck`)

설정 위치: `.claude/settings.json` (프로젝트), `~/.claude/settings.json` (사용자).

```json
{
  "permissions": {
    "allow": ["Bash(git status:*)", "Bash(pnpm typecheck)"],
    "deny": ["Bash(git push --force:*)"]
  }
}
```

→ 자주 묻는 명령 알려주면 Claude가 `/fewer-permission-prompts` 스킬로 자동 정리 가능.

---

## 10. 흔한 함정

### 한 세션에서 너무 많은 일
- 세션이 길어지면 컨텍스트 압축 → 정보 손실
- 큰 작업은 plan 작성 → 작은 PR 단위로 분할

### CLAUDE.md 갱신 안 함
- 패턴이 바뀌었는데 CLAUDE.md가 옛 것을 가리킴
- Claude가 옛 패턴으로 짬 → 매번 교정 필요
- → 규칙이 바뀐 그날 CLAUDE.md 즉시 갱신

### 메모리에 옛 정보
- "X는 미구현"이라고 적었는데 나중에 구현됨 → 메모리 stale
- Claude가 그걸 근거로 잘못된 권고
- → 작업 중 메모리와 코드가 어긋나면 메모리 즉시 갱신/삭제

### 한 PR에 여러 도메인
- "사진 + 알림 + DM 다 같이 수정"
- 리뷰 어렵고 rollback 어려움
- → 도메인 단위 PR 분리

### Claude에게 추측 시키기
- "음... 아마 이렇게 해줘" 식의 모호한 발화
- Claude가 채우면 사용자 의도와 어긋남
- → 분명히 모르면 Claude한테 "선택지 제시해줘" 또는 "1~2문장 질문 해줘"

---

## 11. 추가 슬래시 명령 (사용 시 참고)

`/ultrareview` — 멀티 에이전트 클라우드 리뷰 (사용자 트리거, 유료)
`/schedule` — cron 기반 자동 실행
`/loop` — 같은 명령 N번 반복 (예: 5분마다 deploy 확인)
`/security-review` — 현재 브랜치 보안 검토
`/keybindings-help` — 키보드 단축키 도움

---

## 12. 체크리스트

- [ ] CLAUDE.md가 어떻게 자동 합성되는지 안다
- [ ] Memory의 4가지 종류(user/feedback/project/reference)를 구분할 수 있다
- [ ] plan vs task vs memory의 차이를 안다
- [ ] WARA의 CLAUDE.md가 왜 그렇게 짜여져 있는지 안다
- [ ] 효율적 프롬프트 4요소(위치/상황/목표/제약)를 적용할 수 있다

→ 다음: [19. Skill 만들기](./19-skill-authoring.md)
