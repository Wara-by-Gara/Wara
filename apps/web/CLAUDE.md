# WARA Web — CLAUDE.md
> 루트 CLAUDE.md와 함께 읽힘 (행동 원칙은 루트 참고)

---

## 기술 스택

실제 설치·사용 중인 것만 명시한다.

| 역할 | 라이브러리 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | `output: "standalone"`, Turbopack dev |
| UI 런타임 | React 19 | |
| 서버 상태 | TanStack React Query v5 | |
| 스타일 | Tailwind CSS v4 | CSS-native config (`globals.css` `@theme inline`) |
| 타입 | TypeScript | `@wara/tsconfig` 공유 설정, 별칭 `@/*` → `./src/*` |
| Lint | ESLint | `@wara/eslint-config` + `eslint-config-next` |
| 전역 UI 상태 | Zustand v5 | `authStore`, `notificationStore` 사용 중 |
| 스키마 검증 | Zod v4 | 미사용 (HTML5 native validation 사용) |
| 클래스 유틸 | `class-variance-authority`, `clsx`, `tailwind-merge` | `cn()` 유틸로 래핑됨 (`lib/utils.ts`) |

**워크스페이스 패키지:**
- `@wara/ui` — 공유 UI 컴포넌트
- `@wara/types` — 공유 타입 정의
- `@wara/tsconfig` — TypeScript 설정
- `@wara/eslint-config` — ESLint 규칙

**미설치 (도입 전 팀 논의 필요):** `react-hook-form`, OpenAPI codegen

---

## 폴더 구조

```
src/
  app/
    layout.tsx                 # 루트 레이아웃 (전역 Provider 주입)
    page.tsx                   # 루트 페이지 (/)
    (not-header)/              # 레이아웃 그룹 — 헤더 없음, URL 미포함
      login/
        page.tsx
    (with-header)/             # 레이아웃 그룹 — 헤더 있음, URL 미포함
      admin/
        page.tsx
      edit/
        page.tsx
      invitations/
        page.tsx
      profile/
        page.tsx
  domain/                       # 도메인별 UI 컴포넌트 (PascalCase)
    [Domain]/
      [SubComponent]/
        index.tsx
  hooks/                        # React Query hooks
    use[Domain].ts             # e.g. useInvitations.ts, useNotifications.ts
  lib/
    api/
      client.ts                # HTTP 클라이언트 (모든 fetch는 여기서)
      [domain].ts              # 도메인별 API 함수 e.g. invitations.ts, photos.ts
    utils.ts                   # cn() — clsx + tailwind-merge
    error-messages.ts          # 에러 코드 → 사용자 친화적 메시지 변환
    jwt.ts                     # JWT 디코딩 / 쿠키 읽기
  constants/
    queryKeys.ts               # QUERY_KEYS 중앙집중 팩토리
    routes.ts                  # ROUTES 상수
  stores/                       # Zustand 전역 상태
    authStore.ts
    notificationStore.ts
  providers/
    index.tsx                  # QueryClientProvider 래퍼
  components/                   # 공유 컴포넌트 (최소화, 주로 @wara/ui 사용)
```

**규칙:**
- **API 함수**: `src/lib/api/[domain].ts` (lowercase, 파일 하나당 도메인 하나)
  ```ts
  // ✅ src/lib/api/invitations.ts
  export function getInvitation(id: string) { ... }
  export function createInvitation(payload) { ... }
  ```
- **Hooks**: `src/hooks/use[Domain].ts` (PascalCase Domain)
  ```ts
  // ✅ src/hooks/useInvitations.ts
  export function useInvitation(id) { ... }
  ```
- **Query Keys**: `QUERY_KEYS` from `src/constants/queryKeys.ts` import해서 사용 — 별도 per-domain factory 생성 금지
  ```ts
  // ✅
  import { QUERY_KEYS } from '@/constants/queryKeys';
  queryKey: QUERY_KEYS.invitations.detail(id)
  ```
- **라우트**: `ROUTES` from `src/constants/routes.ts` import해서 사용 — 문자열 하드코딩 금지
  ```ts
  // ✅
  import { ROUTES } from '@/constants/routes';
  router.push(ROUTES.INVITATIONS.DETAIL(id))
  ```
- **공통 타입**: `@wara/types` 워크스페이스 패키지 — `src/types/` 폴더 생성 금지
- **공유 UI 컴포넌트**: `@wara/ui` 워크스페이스 패키지 우선 사용
- 인라인 서브 컴포넌트는 해당 페이지 파일 하단 정의 허용 — 단 **페이지 파일 전체가 200줄을 넘으면** 별도 파일로 분리 검토

---

## UI Boundary 규칙

- 컴포넌트 → UI 렌더링만 담당
- Hook → 상태 관리 및 비즈니스 로직 담당
- API 호출 → 컴포넌트에서 직접 수행 금지 (hook 또는 분리 레이어)

**`'use client'` 경계:**
- `useState`, `useEffect`, 이벤트 핸들러가 필요한 컴포넌트에만 추가
- 최대한 **leaf node(말단 컴포넌트)**에 붙인다 — 부모를 클라이언트로 만들면 하위 트리 전체가 클라이언트 번들에 포함됨
- 현재 모든 페이지가 `'use client'`이므로, 신규 페이지는 이 원칙을 지켜서 서버 컴포넌트로 시작할 것

**Server Actions(`'use server'`):** 현재 미사용. 도입 전 팀 논의 필요.

**`useRouter` import 위치:** 반드시 `next/navigation`에서 import. `next/router`는 Pages Router 전용이며 App Router에서 동작하지 않는다.

```ts
// ✅
import { useRouter } from 'next/navigation';

// ❌ App Router에서 동작 안 함
import { useRouter } from 'next/router';
```

---

## 환경변수

- 클라이언트 코드에서 접근: `NEXT_PUBLIC_` prefix 필수 (없으면 `undefined`)
- 서버 전용 값(API 시크릿, DB URL 등): `NEXT_PUBLIC_` 없이 선언, 서버 컴포넌트·API Route에서만 접근
- 환경변수 직접 하드코딩 금지 — `.env.local` 사용
- 신규 세팅 시 `.env.local.example` 참고

```ts
// ✅ 클라이언트에서 접근 가능
process.env.NEXT_PUBLIC_API_URL

// ❌ 클라이언트에서 undefined — 빌드 에러 없이 조용히 실패함
process.env.API_SECRET
```

**현재 사용 중인 환경변수:**

| 변수 | 접근 범위 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | 클라이언트·서버 | API 베이스 URL (기본값: `http://localhost:3002/api/v1`) |

**`next.config.ts` 변경 (특히 `images.remotePatterns`):** 외부 도메인 이미지 허용은 보안 영향이 있으므로, PR 시 팀 리뷰 후 머지. 와일드카드 호스트 패턴(`hostname: '**'`) 사용 금지 — 구체적인 도메인만 허용.

```ts
// ✅
{ protocol: 'https', hostname: 'storage.googleapis.com' }

// ❌ 모든 외부 이미지 허용 — SSRF 유사 위험
{ hostname: '**' }
```

---

## 에러 처리 규칙

- API 에러는 공통 처리 로직 사용
- 인증 에러 발생 시 → 토큰 갱신 시도 → 실패 시 강제 로그아웃
- 토큰 만료 → 자동 갱신 + SUSPICIOUS_REFRESH 시 강제 로그아웃 (미구현 — 구현 시 `apiClient`에 인터셉터 추가)

---

## API 레이어

**항상 `apiClient`를 통해 호출한다. 컴포넌트·훅에서 raw `fetch` 직접 사용 금지.**

### API 함수 및 Hook 구조

```ts
// ✅ src/lib/api/invitations.ts
import { apiGet, apiPost } from './client';

export function getInvitation(id: string) {
  return apiGet<Invitation>(`/invitations/${id}`);
}

export function createInvitation(payload: CreateInvitationInput) {
  return apiPost<CreatedInvitation>('/invitations', payload);
}

// ✅ src/hooks/useInvitations.ts
import { QUERY_KEYS } from '@/constants/queryKeys';
import { getInvitation, createInvitation } from '@/lib/api/invitations';

export function useInvitation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.detail(id),
    queryFn: () => getInvitation(id),
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.all() }),
  });
}
```

### Query Key 사용

```ts
// ✅ 중앙집중 QUERY_KEYS 사용 (src/constants/queryKeys.ts에서 정의)
import { QUERY_KEYS } from '@/constants/queryKeys';
queryKey: QUERY_KEYS.invitations.all()
queryKey: QUERY_KEYS.invitations.detail(id)

// ❌ per-domain factory 직접 정의 금지
const invitationKeys = { all: ['invitations'] as const, ... }
```

### 라우트 상수

```ts
// ✅ ROUTES 상수 사용
import { ROUTES } from '@/constants/routes';
router.push(ROUTES.INVITATIONS.DETAIL(id));

// ❌ 문자열 하드코딩 금지
router.push(`/invitations/${id}`);
```

### `apiClient` 내부 동작

`src/lib/api/client.ts`의 `apiGet`, `apiPost`, `apiPatch`, `apiDelete` 함수:
- `baseURL`: `NEXT_PUBLIC_API_URL` (없으면 `http://localhost:3002/api/v1`)
- 기본 헤더: `Content-Type: application/json`
- 인증: `localStorage`에서 `access_token` 읽기 → `Authorization: Bearer {token}` 주입
  - **클라이언트 전용** — 서버 컴포넌트에서 `apiClient` 직접 호출 금지
- 응답 envelope: `{ success: true, data: T }` → `T` 반환, `{ success: false, error }` → throw
- 401 TOKEN_EXPIRED 시 자동 갱신 — 최대 1회만 재시도

**응답 계약:**
- 성공 시 `Promise<T>` 직접 반환 — `{ data, error }` 래퍼 없음
- 실패 시 `throw` — `error.message`가 에러 코드 문자열 (`@docs/conventions/error-codes.md` 참고)
- `204 No Content`는 `undefined` 반환

### 뮤테이션 후 캐시 전략

- 기본: `invalidateQueries` — 목록 전체 재요청
- 응답 바디에 업데이트된 객체가 포함된 경우: `setQueryData`로 상세 캐시 즉시 갱신 허용
- 낙관적 업데이트(onMutate + rollback)는 UX상 꼭 필요한 경우에만 사용

---

## 상태 관리

### 계층별 상태 저장소

| 계층 | 기술 | 용도 | 예시 |
|---|---|---|---|
| **서버 상태** | React Query | API 데이터 캐싱 | 초대장 목록, 프로필 정보 |
| **전역 UI 상태** | Zustand | 여러 페이지에서 필요한 상태 | `isLoggedIn`, 알림 카운트 |
| **로컬 UI 상태** | `useState` | 단일 컴포넌트 내 상태 | 모달 열림/닫힘, 폼 입력값 |

**규칙:**
- 서버 상태와 클라이언트 상태 혼합 금지 — React Query 캐시를 `useState`나 Zustand에 복사하지 말 것
- Zustand store는 `src/stores/[name]Store.ts` 파일로 생성
- Store 간 직접 참조 금지

### Zustand 사용 예시

```ts
// ✅ src/stores/authStore.ts
"use client";
import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  hydrated: boolean;
  hydrate: () => void;
  login: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  hydrated: false,
  hydrate: () => {
    const hasRole = typeof window !== "undefined" &&
      document.cookie.split("; ").some((row) => row.startsWith("userRole="));
    set({ isLoggedIn: hasRole, hydrated: true });
  },
  login: () => set({ isLoggedIn: true }),
  logout: async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    set({ isLoggedIn: false });
  },
}));

// ✅ 컴포넌트에서 사용
const { isLoggedIn } = useAuthStore();
```

---

## UI 패턴

같은 UI 요소를 다르게 구현하지 않도록 아래 패턴을 그대로 사용한다.

### 페이지 레이아웃 shell

```tsx
// 목록 페이지
<main className="max-w-4xl mx-auto px-4 py-10">

// 상세 페이지
<main className="max-w-2xl mx-auto px-4 py-10">
```

### 반응형

모바일(카드)과 PC(테이블)를 항상 쌍으로 렌더링한다.

```tsx
{/* 모바일: 카드 */}
<div className="block md:hidden"> ... </div>

{/* PC: 테이블 */}
<div className="hidden md:block"> ... </div>
```

### 로딩 / 빈 상태

```tsx
<p className="text-center text-gray-400 py-10">불러오는 중...</p>
<p className="text-center text-gray-400 py-10">목록이 없습니다</p>
```

스켈레톤·스피너 없이 텍스트만 사용한다.

**`isFetching` (백그라운드 재요청):** 별도 UI 처리 없이 무시한다. 데이터가 교체될 때 React가 자동으로 리렌더링한다.

### 폼 상태 관리

**단일 객체 `useState`를 사용한다.** 필드별 `useState` 여러 개 선언 금지.

```tsx
const [form, setForm] = useState({ title: '', content: '' });

// input/textarea/select 공통 핸들러
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
  setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

// input에 name 속성 필수
<input name="title" value={form.title} onChange={handleChange} />
```

### 폼 유효성 검사

zod 미설치 — 현재 기준: **submit 시점에 `errors` 객체로 검증, 필드별 에러 표시.**

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

function validate() {
  const next: Record<string, string> = {};
  if (!form.title.trim()) next.title = '제목을 입력해주세요';
  if (form.content.length < 10) next.content = '내용을 10자 이상 입력해주세요';
  setErrors(next);
  return Object.keys(next).length === 0;
}

function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!validate()) return;
  mutate(form);
}

// 필드 아래에 에러 렌더링
{errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
```

### 확인 모달

```tsx
{isOpen && (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
  >
    <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
      <p id="modal-title" className="text-lg font-medium mb-6">정말 삭제하시겠습니까?</p>
      <div className="flex gap-3 justify-end">
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">삭제</button>
      </div>
    </div>
  </div>
)}
```

### 버튼 변형 (5종)

| 용도 | 클래스 |
|---|---|
| 주요 액션 | `px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors` |
| 어드민 액션 | `px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors` |
| 삭제 확인 | `px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors` |
| 보조 (테두리) | `px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors` |
| 텍스트 링크 | `text-sm text-blue-600 hover:text-blue-800` |

공유 Button 컴포넌트 없음 — 위 클래스를 그대로 쓸 것.

**뮤테이션 중 버튼 비활성화: `isPending`이면 항상 `disabled` 처리. 폼 필드도 함께 비활성화한다.**

```tsx
<input name="title" value={form.title} onChange={handleChange} disabled={isPending} />
<textarea name="content" value={form.content} onChange={handleChange} disabled={isPending} />

<button type="submit" disabled={isPending}>
  {isPending ? '저장 중...' : '저장'}
</button>
```

### 상태 뱃지

```tsx
// 타입·상태 label map은 features/[domain]/types.ts에 정의
<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
  {status.label}
</span>
```

뱃지 배경색 기준:
- neutral(대기): `bg-gray-100 text-gray-600`
- in-progress(진행): `bg-blue-100 text-blue-600`
- resolved(완료): `bg-green-100 text-green-600`

### 날짜 표시

서버는 UTC ISO 8601 문자열을 내려준다. `new Date(x)`는 브라우저 로컬 타임존으로 파싱하므로 **한국(KST, UTC+9) 사용자 기준으로 올바르게 표시**된다. 타임존을 별도로 변환하지 않는다.

> **SSR hydration mismatch 주의:** 서버(UTC)와 클라이언트(KST)의 `toLocaleDateString()` 결과가 달라 hydration 경고가 발생할 수 있다. 날짜를 표시하는 컴포넌트는 `'use client'`로 선언하거나, **날짜 요소에만** `suppressHydrationWarning`을 추가한다. 레이아웃이나 페이지 전체에 붙이면 실제 버그를 가릴 수 있으니 남용 금지.
> ```tsx
> <time suppressHydrationWarning>{new Date(x).toLocaleDateString('ko-KR')}</time>
> ```

```tsx
// 목록 (날짜만)
new Date(x).toLocaleDateString('ko-KR')

// 상세 페이지 헤드라인 (날짜+시간)
new Date(x).toLocaleDateString('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric',
  hour: '2-digit', minute: '2-digit',
})
```

### 뮤테이션 성공/실패 피드백

toast 라이브러리 미설치. 현재 기준:

| 케이스 | 처리 |
|---|---|
| 성공 후 페이지 이동 | `router.push()` — 별도 피드백 없음 |
| 성공 후 제자리 유지 (좋아요, 상태 변경 등) | UI 상태가 즉시 반영되면 피드백 생략, 아니면 인라인 텍스트 |
| 실패 | `onError`에서 인라인 에러 텍스트 렌더링 |

```tsx
// e.message는 내부 에러 코드(UNAUTHORIZED, DB_CONNECTION_FAILED 등) — 사용자에게 그대로 노출 금지
// 에러 코드 → 메시지 변환은 lib/error-messages.ts에서 일괄 관리
import { getErrorMessage } from '@/lib/error-messages';

const [submitError, setSubmitError] = useState('');

useMutation({
  mutationFn: ...,
  onSuccess: () => router.push('/list'),
  onError: (e) => setSubmitError(getErrorMessage(e)),
});

// 렌더링
{submitError && <p className="text-sm text-red-500">{submitError}</p>}
```

### 네비게이션

```tsx
// 뮤테이션 성공 후 이동
router.push('/path')

// 뒤로가기 — 히스토리가 없으면 앱 밖으로 나가므로, 목록 URL을 명시적으로 fallback
// history.length는 직접 URL 입력 시에도 1보다 클 수 있어 완벽하지 않음
// 더 정밀하게 판별해야 한다면 sessionStorage로 referrer 추적 고려
<button
  onClick={() => {
    if (window.history.length > 1) router.back();
    else router.push('/list');
  }}
  className="text-sm text-gray-600 hover:text-gray-900"
>
  ← 목록으로
</button>
```

`<Link>`는 nav 메뉴 등 정적 링크에만 사용한다.

---

## Never

- raw `fetch` 직접 사용 (`apiClient` 사용)
- 라우트 문자열 하드코딩 (`ROUTES` 상수 import해서 사용)
- Query Key 직접 정의 (`QUERY_KEYS` from `constants/queryKeys.ts` 사용)
- 동일 상수(label map, status map)를 여러 파일에 복붙 (import해서 사용)
- API 호출을 hooks 외 곳에서 수행 (컴포넌트, store, util 등)
- `src/types/` 폴더 생성 (`@wara/types` 워크스페이스 패키지 사용)
- Redux 사용 (zustand 사용)
- 컴포넌트에서 직접 API 호출 (훅 경유)
- 컴포넌트에 비즈니스 로직 작성 (커스텀 훅으로 분리)
- 환경변수 하드코딩
- `dangerouslySetInnerHTML` 사용 (불가피한 경우 DOMPurify로 sanitize 후 사용)
- 임시저장을 서버에 저장 (localStorage 1개)
- localStorage에 개인정보·인증 관련 데이터 저장 (토큰, 이메일, 사용자 ID 등 — XSS 시 탈취 가능)
- 서버 컴포넌트에서 `apiClient` 직접 호출 (토큰 없이 요청이 나감)
- 검증 에러를 한 곳에 뭉쳐서 표시 (필드별로 표시)
- 폼 필드를 필드별 `useState` 여러 개로 관리 (단일 객체 `useState` 사용)
- `isPending` 중 버튼·폼 필드 `disabled` 누락 (submit 중복 호출 방지)
- 정적 링크가 아닌 곳에 `<Link>` 사용 (뮤테이션 후 이동은 `router.push()` 사용)
- React Query 캐시를 zustand/useState에 복사 (캐시 불일치 방지)

**V1.1+ 미구현 기능 (기획 확정 전 UI 구현 금지):** DM / AI 추천 / 날짜 투표 / 이모지 피커

---

## Tailwind CSS v4 — 커스텀 토큰

v4는 `tailwind.config.ts` 없이 `src/app/globals.css`의 `@theme inline` 블록으로 디자인 토큰을 관리한다. 임의의 값이 필요할 때 인라인 스타일(`style={{ color: '#...' }}`) 사용 금지 — 반드시 `@theme`에 토큰으로 추가한다.

```css
/* globals.css */
@theme inline {
  --color-brand: #your-color;
  --spacing-page: 2.5rem;
}
```

```tsx
/* 사용 */
<div className="text-brand px-[--spacing-page]" />
```

---

## 이미지·에셋

- 이미지는 `next/image`의 `<Image>` 컴포넌트 사용 — `<img>` 태그 직접 사용 금지
- 외부 이미지 도메인은 `next.config.ts`의 `images.remotePatterns`에 등록 후 사용
- **SVG 아이콘:** `lucide-react` 사용 (이미 설치됨). 그 외 아이콘 라이브러리 추가 도입 시 팀 논의

**`<Image>` 필수 props:**
- `alt` 필수 — 순수 장식 이미지는 `alt=""`
- 크기가 고정된 이미지: `width` + `height` 명시
- 컨테이너를 꽉 채우는 이미지: `fill` 사용 (부모에 `position: relative` 필요)

```tsx
// 고정 크기
<Image src={url} alt="프로필 사진" width={48} height={48} className="rounded-full" />

// fill (부모가 크기를 정의)
<div className="relative w-full aspect-video">
  <Image src={url} alt="커버 이미지" fill className="object-cover" />
</div>
```

---

## 에러 처리 · 에러 바운더리

현재 `<ErrorBoundary>` 미사용. 기본 방침:
- `useQuery`의 `isError` 상태를 체크해 페이지 내에서 에러 메시지 렌더링
- 뮤테이션 실패는 `onError` 콜백에서 사용자에게 피드백 (toast 없으면 인라인 에러 텍스트)
- 페이지 전체가 깨지는 치명적 에러에만 `<ErrorBoundary>` 도입 검토

```tsx
// useQuery 에러 처리 기본 패턴
const { data, isLoading, isError } = useQuery({ ... });
if (isError) return <p className="text-center text-red-500 py-10">오류가 발생했습니다</p>;
```

---

## 테스트

**V1에서는 테스트 미작성.** 타입 검사(`pnpm typecheck`)와 린트(`pnpm lint`)로 대체.

---

## Refs
- @docs/api/WARA_API_설계_v0.7.md
- @docs/conventions/error-codes.md
