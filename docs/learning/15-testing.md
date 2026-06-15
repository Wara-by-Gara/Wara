# 15. 테스트 전략

> 단위 / 통합 / E2E — 세 층의 역할과 도구.

---

## 1. 세 가지 층

### (1) 단위 테스트 (Unit)
**범위**: 한 함수, 한 서비스, 한 컴포넌트.
**도구**: Jest (BE), Vitest (FE)
**무엇을 잡나**: 로직 버그, edge case
**속도**: 매우 빠름 (수십 ms)
**의존성 mock**: DB, 외부 API 다 mock

### (2) 통합 테스트 (Integration)
**범위**: 여러 모듈 묶음 (예: Controller → Service → Repository → DB)
**도구**: Jest + 실제 DB (Drizzle), Vitest + MSW (FE)
**무엇을 잡나**: 모듈 간 계약 깨짐, DB 쿼리 실수
**속도**: 보통 (수백 ms)
**의존성**: 실제 DB는 띄움, 외부 API는 mock

### (3) E2E 테스트
**범위**: 브라우저로 실제 페이지 클릭
**도구**: Playwright (FE)
**무엇을 잡나**: UX 깨짐, 화면 흐름
**속도**: 느림 (수초~수분)
**의존성**: 실제 백엔드 + DB 또는 MSW + dev server

---

## 2. 백엔드 테스트 — Jest

### 설정
`apps/api/package.json:102`:
```json
"jest": {
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node"
}
```

### 단위 테스트 예시
`apps/api/src/auth/auth.controller.spec.ts`, `apps/api/src/ai/ai-monitoring.service.spec.ts` 등.

기본 패턴:
```ts
describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<AuthRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: createMock<AuthRepository>() },
        // ... 다른 의존성 mock
      ],
    }).compile();
    service = module.get(AuthService);
    repo = module.get(AuthRepository);
  });

  it('generateState should produce a JWT', () => {
    const state = service.generateState();
    expect(state).toMatch(/^eyJ/);
  });
});
```

### 낙관적 락 테스트
`apps/api/src/invitations/invitations.optimistic-lock.spec.ts`:
- `expectedUpdatedAt` 불일치 시 `INVITATION_VERSION_CONFLICT` 보장
- 두 동시 요청 시뮬레이션

### AI 한도 race 테스트
`apps/api/src/ai-generations/ai-generations.service.spec.ts`:
- 일일 한도 race condition 검증
- 현재는 race를 통과시키는(failing) 형태로 작성되어 있어, todo의 "race condition 보강" 후 기대값 수정 대상

### 실행
```bash
pnpm --filter @wara/api test
pnpm --filter @wara/api test:watch     # 파일 변경 감지
pnpm --filter @wara/api test:cov       # 커버리지
```

---

## 3. 프론트 단위·통합 — Vitest

### 설정
- `vitest`로 빠르게 (esbuild 기반)
- `@testing-library/react`로 컴포넌트 렌더
- `jsdom` 환경

### 컴포넌트 테스트 예시
```tsx
import { render, screen } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  it('renders title and buttons', () => {
    render(<ConfirmModal isOpen title="정말 삭제?" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('정말 삭제?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });
});
```

### API hook 테스트 — MSW
```tsx
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('*/photos', () => HttpResponse.json({ success: true, data: [] })),
);
beforeAll(() => server.listen());
afterAll(() => server.close());

it('usePhotoList returns empty array', async () => {
  const { result } = renderHook(() => usePhotoList('inv_1'));
  await waitFor(() => expect(result.current.data).toEqual([]));
});
```

### 실행
```bash
pnpm --filter @wara/web test       # vitest run
pnpm --filter @wara/web test --watch
```

---

## 4. E2E — Playwright

`apps/web/e2e/`에 30+개 스펙.

### 설정
`apps/web/playwright.config.ts`:
- 멀티 브라우저 (Chromium, WebKit, Firefox)
- `globalSetup`으로 인증 세션 준비
- `webServer`로 dev 서버 자동 기동

### 페르소나 패턴
`e2e/personas.ts`에 시나리오용 유저 정의:
```ts
export const HOST = { email: 'host@test.com', name: 'Host' };
export const GUEST_A = { email: 'guest-a@test.com', name: 'Guest A' };
```

### 인증 세팅
`e2e/auth.setup.ts`가 로그인 → storage state 저장 → 다른 테스트들이 이미 로그인된 상태에서 시작.

### 스펙 예시
```ts
import { test, expect } from '@playwright/test';

test.describe('초대장 생성', () => {
  test.use({ storageState: 'host.storageState.json' });

  test('호스트가 초대장 생성', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '새 초대장' }).click();
    await page.getByLabel('제목').fill('생일파티');
    // ...
    await expect(page.getByText('초대장이 생성되었습니다')).toBeVisible();
  });
});
```

### 도메인별 spec
- `dm-flow.spec.ts` — DM 1:1·그룹·이미지·이모지 흐름 (~30개 케이스)
- `location-flow.spec.ts` — 실시간 위치 (WebSocket)
- `date-vote-flow.spec.ts` — 투표 생성·응답·확정
- `guest-album.spec.ts`, `guest-photo.spec.ts` — 사진 관련
- `anon.spec.ts` — 비로그인 흐름
- 그 외 `host-edit`, `hostOperator`, `newHost`, `guest-edge` 등

### 실행
```bash
pnpm --filter @wara/web test:e2e        # headless 전체
pnpm --filter @wara/web test:e2e:ui     # Playwright UI 모드 (디버깅)
```

---

## 5. 현재 알려진 사전 결함 (todo)

전체 `pnpm test:e2e` 실행 시 노출:
- `dmFlow` (~30) UI/실시간 다수 실패
- `locationFlow` (~30) UI timeout/실패
- `anon` 일부 — `시작하기 CTA` 등
- `guest-profile` — 닉네임 입력 45초 timeout
- `voteFlow` — API 일부 (01/04/06/08/09/10/11/12)

→ todo의 "외부 E2E 사전결함 진단" 항목.

---

## 6. CI에서 테스트

`.github/workflows/ci.yml`:
- PR마다 lint / typecheck / test 실행
- 실패하면 머지 차단

(현재 E2E는 CI에서 안 돌리는 듯 — 사전결함 정리 후 활성화 가능)

### 추가 검증 필요 (todo)
- `db:migrate && db:seed` 자동 검증 CI 워크플로 — `chore/ci-migrate-seed-check`

---

## 7. 픽스처 데이터

### 시드 종류
- `seed/index.ts` — 풀 픽스처 (dev 한정)
- `seed-essential.ts` — 운영 필수 (약관, 템플릿)
- `purge-fixture-seed.ts` — 픽스처 정리

### tier0 유저
`seed/tier0-users.ts` — 개발용 시나리오 유저들.

### E2E에서 시드 활용
- Playwright globalSetup이 DB reset + seed
- 각 테스트가 같은 시작점에서 출발

---

## 8. Storybook (디자인 검증)

`apps/web/`의 `storybook` 스크립트.
- 컴포넌트를 격리 환경에서 시각 확인
- `@storybook/addon-a11y`로 접근성 lint
- 디자이너·개발자가 디자인 토큰 공유

```bash
pnpm --filter @wara/web storybook
```

---

## 9. 어떤 테스트를 어디에 쓸까

| 검증 대상 | 도구 |
|---|---|
| 비즈니스 로직 분기 (각종 if) | Jest 단위 |
| 트랜잭션 동작 | Jest 통합 (DB 실제) |
| 외부 API 실패 시나리오 | Jest + mock |
| 컴포넌트 렌더 | Vitest + RTL |
| API hook 동작 | Vitest + MSW |
| 사용자 흐름 (멀티 페이지) | Playwright |
| 시각적 회귀 | Storybook + Chromatic (도입 시) |

---

## 10. 흔한 함정

### Mock에 너무 의존
실제 동작과 mock이 어긋남 → 테스트는 통과하는데 운영에서 깨짐.
→ 통합 테스트로 실제 DB를 한 번이라도 거치게.

### E2E 타이밍 의존
`page.waitForTimeout(1000)` 같은 sleep → flaky.
→ `expect(...).toBeVisible()`로 조건 대기.

### 픽스처가 코드 변경에 의존
시드 데이터 모양이 schema 변경에 못 따라옴 → 테스트 갑자기 깨짐.
→ todo의 "시드↔schema 정합 CI 체크" 항목.

### `forbidNonWhitelisted: true`에 걸린 DTO
ValidationPipe 옵션 때문에, DTO에 없는 필드를 추가한 요청이 400. 테스트에서 의외의 실패 원인이 될 수 있음.

---

## 11. 체크리스트

- [ ] 단위·통합·E2E 세 층의 책임을 구분할 수 있다
- [ ] Jest는 백엔드, Vitest는 프론트 단위·통합, Playwright는 E2E라는 걸 안다
- [ ] MSW가 프론트 테스트에서 어떻게 쓰이는지 안다
- [ ] Playwright의 페르소나·storageState 패턴을 안다
- [ ] 현재 사전 결함 영역(dmFlow / locationFlow 등)을 알고 있다

→ 끝. [README](./README.md)로 돌아가서 다음 주제 학습.
