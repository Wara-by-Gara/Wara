# 06. 프론트엔드 스택

> Next.js 15 App Router + TanStack Query + Zustand. "왜 이 조합인지" + "어떻게 묶여 돌아가는지".

---

## 1. 왜 Next.js App Router인가

### Next.js Pages Router vs App Router
- **Pages Router** (구버전): `pages/` 폴더, 모두 클라이언트 컴포넌트, SSR/SSG는 옵션
- **App Router** (Next 13+): `app/` 폴더, **기본이 서버 컴포넌트(RSC)**, 클라이언트는 명시적 (`'use client'`)

### App Router의 장점
- 서버에서 fetch → 초기 HTML이 데이터 포함 → 초기 표시 빠름
- 인증 가드를 미들웨어(`middleware.ts`)로 모든 경로에 일괄 적용
- layout 중첩으로 공통 UI 재사용 쉬움

### WARA에서 주의점 (`apps/web/CLAUDE.md`)
- 거의 모든 페이지에 `'use client'`가 붙어 있음 (React Query / `useState` 필요)
- 신규 페이지는 가능하면 서버 컴포넌트로 시작, leaf만 `'use client'`로

---

## 2. 디렉터리 한눈에

```
apps/web/src/
├── app/               # App Router 페이지 (URL 1:1)
│   ├── layout.tsx     # 루트 레이아웃 (전역 Provider)
│   ├── page.tsx       # / (홈)
│   ├── globals.css    # Tailwind v4 @theme
│   ├── error.tsx      # 페이지 에러 바운더리
│   ├── global-error.tsx
│   └── (auth)/login/page.tsx  # route group — 괄호는 URL에 포함 안 됨
├── components/        # 공유 UI 컴포넌트
├── domain/            # 도메인별 로직 (api, hooks, types)
├── lib/               # apiClient, jwt, query-client 등
├── stores/            # Zustand stores
├── providers/         # 전역 Provider (QueryClientProvider 등)
├── hooks/             # 공유 hook
├── screens/           # 페이지 단위 큰 컴포넌트
├── mocks/             # MSW handlers
├── middleware.ts      # 인증 가드
└── types/             # 도메인 횡단 타입
```

### `app/`의 특수 파일
| 파일 | 역할 |
|---|---|
| `page.tsx` | URL과 1:1 매칭 |
| `layout.tsx` | 자식들을 감싸는 공통 UI |
| `loading.tsx` | Suspense fallback |
| `error.tsx` | error boundary |
| `not-found.tsx` | 404 |
| `route.ts` | API Route Handler |

### route group `(auth)`
- 괄호 폴더는 URL에 포함되지 않음
- 같은 URL 구조 안에서 layout만 다르게 묶을 때 사용

---

## 3. 루트 레이아웃

`app/layout.tsx:19`:
```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="...">
        <OAuthCallbackHandler />
        <Providers>
          <TermsComplianceRedirect />
          <NotificationSocketMount />
          <DmSocketMount />
          {children}
          <MainBottomNav />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

### `Providers`
`lib/providers.tsx:6`:
```tsx
'use client';
export function Providers({ children }) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```
→ React Query를 최상위에서 1개만 띄워서 캐시 공유.

### Socket Mount들
- `NotificationSocketMount`, `DmSocketMount` 컴포넌트가 마운트되면 Socket.IO 연결
- 페이지 이동에도 살아남도록 layout에 위치 (page에 두면 unmount 시 연결 끊김)

### `suppressHydrationWarning`이 `<html>`에만
- Trancy/Grammarly 같은 번역·문법 확장이 hydration 전에 `<html>` attribute를 주입 → mismatch
- `<html>`에만 한정해서 자식 트리의 진짜 hydration 버그는 그대로 노출 (남용 금지 패턴)

---

## 4. TanStack React Query (서버 상태)

### 왜 필요한가
- `fetch` + `useState` + `useEffect`로 직접 구현하면: 캐시·재시도·로딩 상태·invalidation을 매번 손으로 짜야 함
- React Query는 그걸 자동으로

### 핵심 개념
- **QueryClient**: 전역 캐시
- **`useQuery`**: GET류 — 자동 재요청·캐시
- **`useMutation`**: POST/PATCH/DELETE — 성공·실패 콜백
- **`queryKey`**: 캐시 키

### Query Key Factory 패턴 (WARA 규칙)
```ts
// domain/[domain]/hooks.ts 상단
export const photoKeys = {
  all: ['photo'] as const,
  list: (invitationId: string) => [...photoKeys.all, 'list', invitationId] as const,
  detail: (id: string) => [...photoKeys.all, id] as const,
};

export function usePhotoList(invitationId: string) {
  return useQuery({
    queryKey: photoKeys.list(invitationId),
    queryFn: () => photoApi.list(invitationId),
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: photoApi.upload,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photoKeys.list(...) }),
  });
}
```

→ 키를 함수로 만들어두면 invalidate할 때 타입 안전.

---

## 5. apiClient — HTTP 추상화

`lib/api-client.ts:15`:
```ts
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api';

export class ApiError extends Error {
  constructor(public code, public type, message, public details?) { super(message); }
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',        // 쿠키 자동 첨부
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  if (!json.success) {
    throw new ApiError(json.error.code, json.error.type, json.error.message, json.error.details);
  }
  return json.data as T;
}
```

### 핵심
- **`credentials: 'include'`**: 쿠키를 매 요청에 자동 첨부 (서버 응답의 `Set-Cookie`도 받음)
- **응답 unwrap**: `{ success: true, data }`에서 `data`만 반환 → 호출 측은 `T`만 다룸
- **에러 throw**: `{ success: false, error }`면 `ApiError`로 변환해 throw → React Query의 `isError`/`onError`로 감지

### 규칙 (`apps/web/CLAUDE.md`)
- raw `fetch` 직접 사용 금지 → 항상 `apiClient`
- 도메인별 `domain/[domain]/api.ts`에 호출 함수 모아둠

---

## 6. Zustand — 선택적 클라이언트 상태

### 언제 쓰나
- **서버 상태**: React Query
- **UI 로컬 상태 (단일 컴포넌트)**: `useState`
- **앱 전역 클라이언트 상태**: Zustand (작고 빠른 store)

### 현재 사용처
WARA는 Zustand를 거의 안 씀 (React Query로 충분). 단 두 가지:
- `authStore.ts`: 로그인 상태 (`is_logged_in` 쿠키 기반)
- `notificationSocketStore.ts`: 알림 소켓 상태

`stores/authStore.ts:16`:
```ts
export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  hydrated: false,
  hydrate: () => set({ isLoggedIn: isLoggedInCookieSet(), hydrated: true }),
  login: () => set({ isLoggedIn: true }),
  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    document.cookie = 'accessToken=; Max-Age=0; path=/';
    // ...
    getQueryClient().clear();   // React Query 캐시도 비움
    set({ isLoggedIn: false });
  },
}));
```

---

## 7. middleware.ts — 인증 가드

`apps/web/src/middleware.ts:12`:
```ts
export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.has('is_logged_in');
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/notifications/:path*', '/meetings/:path*', '/calendar/:path*', '/edit/:path*'],
};
```

### 핵심
- Edge에서 실행 → 빠름
- `is_logged_in` 쿠키(HttpOnly=false)로 단순 판별 (액세스 토큰은 안 봄 — 검증은 서버에 맡김)
- `matcher`로 보호할 경로 선언

→ 보안의 진짜 방어선은 백엔드의 `JwtAuthGuard`. middleware는 UX용 (로그인 안 한 사용자가 보호 페이지 접근 시 바로 redirect).

---

## 8. Tailwind CSS v4

### 변경점 (v3 → v4)
- `tailwind.config.ts` 없음 → CSS에서 직접 `@theme inline`로 토큰
- `globals.css`에 모든 디자인 토큰

```css
/* globals.css */
@theme inline {
  --color-brand: #...;
  --spacing-page: 2.5rem;
}
```

```tsx
<div className="text-brand px-[--spacing-page]" />
```

### 규칙
- 인라인 `style={{ color: '#xxx' }}` 금지 → 항상 토큰
- 임의 클래스는 `[...]` 안에 (`mt-[3px]`)

---

## 9. 폼 패턴 (CLAUDE.md 규칙)

```tsx
const [form, setForm] = useState({ title: '', content: '' });
const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

<input name="title" value={form.title} onChange={handleChange} disabled={isPending} />
```

- **필드별 useState 여러 개 금지** → 단일 객체
- **mutation 중엔 모든 필드 disabled**
- 검증은 **submit 시점**에 `errors` 객체로

---

## 10. MSW (Mock Service Worker)

`apps/web/package.json:81`:
```json
"msw": { "workerDirectory": ["public"] }
```

- 브라우저에서 fetch를 가로채 mock 응답
- 백엔드 없이 프론트 개발 가능
- Storybook·테스트 환경에서도 같은 핸들러 재사용

→ 테스트는 [15. 테스트 전략](./15-testing.md).

---

## 11. 빌드·실행

```bash
pnpm --filter @wara/web dev        # next dev --turbopack (HMR 빠름)
pnpm --filter @wara/web build      # next build (Standalone 출력)
pnpm --filter @wara/web start      # 운영 실행
pnpm --filter @wara/web typecheck  # tsc --noEmit
pnpm --filter @wara/web test       # vitest
pnpm --filter @wara/web test:e2e   # playwright
pnpm --filter @wara/web storybook  # storybook dev
```

---

## 12. 흔한 함정

### 서버 컴포넌트에서 `apiClient` 호출
`apiClient`는 `document.cookie` 접근 — 서버에선 undefined.
→ 서버에서 호출 필요하면 별도 fetch 함수 작성 (또는 token을 명시적으로 전달).

### `useRouter` import 경로
**`next/navigation`** (App Router). `next/router`는 Pages Router 전용.

### 환경변수 `NEXT_PUBLIC_` 누락
클라이언트에서 `process.env.SECRET`은 빌드 타임에 `undefined`로 치환됨. 조용히 실패.

### Hydration mismatch (날짜)
서버(UTC)와 클라이언트(KST) `toLocaleDateString` 결과가 다름.
→ 해당 `<time>`에만 `suppressHydrationWarning`. 페이지 전체엔 붙이지 말 것.

### `<img>` 직접 사용
`next/image`의 `<Image>` 강제 — 외부 도메인은 `next.config.ts`의 `images.remotePatterns`에 등록.

---

## 13. 체크리스트

- [ ] App Router의 `'use client'`가 언제 필요한지 안다
- [ ] React Query의 `queryKey` factory 패턴을 쓸 수 있다
- [ ] `apiClient`가 응답 envelope을 어떻게 unwrap하는지 안다
- [ ] middleware.ts가 백엔드 가드와 어떻게 다른지 안다 (UX vs 보안)
- [ ] Tailwind v4의 `@theme` 패턴을 안다

→ 다음: [07. 인프라](./07-infra.md)
