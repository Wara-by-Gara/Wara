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

**미설치 (도입 전 팀 논의 필요):** `zod`, `react-hook-form`, `zustand`, OpenAPI codegen

---

## 폴더 구조

```
src/
  app/
    layout.tsx          # 루트 레이아웃 (전역 Provider 주입)
    page.tsx            # 루트 페이지 (/)
    inquiries/          # /inquiries
      page.tsx
      [id]/             # /inquiries/:id (동적 세그먼트)
        page.tsx
    admin/              # /admin
      inquiries/
        page.tsx
    (auth)/             # route group — URL에 포함되지 않음, 레이아웃 분리용
      login/
        page.tsx
    # loading.tsx, error.tsx — 현재 미사용. 도입 전 팀 논의
  features/             # 도메인별 로직
    [domain]/
      types.ts          # 타입 + 공유 상수 (label map 등)
      api.ts            # apiClient 호출 함수 모음
      hooks.ts          # React Query hooks
  lib/
    api-client.ts       # HTTP 클라이언트 (모든 fetch는 여기서)
    jwt.ts              # JWT 디코딩 / 쿠키 읽기
    query-client.ts     # QueryClient 팩토리
    providers.tsx       # QueryClientProvider 래퍼
  types/                # 도메인 횡단 공통 타입
    common.ts           # PaginationMeta, ApiError, 공통 enum 등
```

**규칙:**
- 동일한 상수(label map 등)는 `features/[domain]/types.ts`에 한 번만 정의하고 import해서 사용 — 여러 파일에 복붙 금지
- **도메인 횡단 공통 타입** (여러 feature에서 공유하는 `PaginationMeta`, `ApiError` 등)은 `src/types/common.ts`에 정의
- Query Key Factory(`domainKeys`)는 `features/[domain]/hooks.ts` 상단에 정의
- 인라인 서브 컴포넌트는 해당 페이지 파일 하단 정의 허용 — 단 **페이지 파일 전체가 200줄을 넘으면** 서브 컴포넌트를 별도 파일로 분리 검토
- `src/components/` 공유 컴포넌트 폴더는 3개 이상의 페이지에서 재사용될 때만 만들 것

**모노레포 공유 패키지** (`packages/` 또는 workspace 루트):
- `@wara/tsconfig` — TypeScript 설정 공유
- `@wara/eslint-config` — ESLint 규칙 공유
- 패키지 추가·변경은 루트 `pnpm-workspace.yaml` 확인 후 팀 논의

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

```ts
// ✅ features/[domain]/api.ts
export const domainApi = {
  getList: () => apiClient.get<ListResponse>('/path'),
  create: (body: CreateInput) => apiClient.post<Item>('/path', body),
};

// ✅ features/[domain]/hooks.ts
export function useDomainList() {
  return useQuery({ queryKey: domainKeys.list(), queryFn: domainApi.getList });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: domainApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: domainKeys.list() }),
  });
}
```

**Query Key Factory 패턴 — 모든 도메인에 동일하게 적용 (`hooks.ts` 상단에 정의):**
```ts
export const domainKeys = {
  all: ['domain'] as const,
  list: () => [...domainKeys.all, 'list'] as const,
  detail: (id: string) => [...domainKeys.all, id] as const,
};
```

**`apiClient` 내부 동작:**
- `baseURL`: `NEXT_PUBLIC_API_URL` (없으면 `http://localhost:3002/api/v1`)
- 기본 헤더: `Content-Type: application/json`
- 인증: 매 요청마다 `document.cookie`에서 `accessToken` 파싱 → `Authorization: Bearer {token}` 주입
  - **클라이언트 전용** — 서버 컴포넌트에서 `apiClient` 직접 호출 금지 (토큰 없이 요청이 나가 조용히 실패함. 필요 시 팀 논의)
  - ⚠️ **보안 리스크:** `accessToken`이 JS로 읽을 수 있는 쿠키에 저장되어 XSS 시 탈취 가능. 장기적으로 백엔드와 협의해 `HttpOnly; Secure; SameSite=Strict` 쿠키로 전환 필요
- 응답 envelope: `{ success: true, data: T }` → `T` 반환, `{ success: false, error }` → throw

**`apiClient` 반환 계약:**
- 성공 시 `Promise<T>` 직접 반환 — `{ data, error }` 래퍼 없음
- 실패 시 `throw new Error(errorCode)` — `error.message`가 에러 코드 문자열 (`@docs/conventions/error-codes.md` 참고)
- `204 No Content`는 `undefined` 반환

**뮤테이션 후 캐시 전략:**
- 기본: `invalidateQueries` — 목록 전체 재요청
- 응답 바디에 업데이트된 객체가 포함된 경우: `setQueryData`로 상세 캐시 즉시 갱신 허용
- 낙관적 업데이트(onMutate + rollback)는 UX상 꼭 필요한 경우에만 사용

---

## 상태 관리

- **서버 상태** → React Query (`useQuery`, `useMutation`)
- **UI 상태** → `useState` (열림/닫힘, 폼 입력값, 선택된 항목 등)
- 서버 상태와 클라이언트 상태 혼합 금지 — React Query 캐시를 직접 `useState`에 복사하지 말 것

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
const [submitError, setSubmitError] = useState('');

// e.message는 내부 에러 코드(UNAUTHORIZED, DB_CONNECTION_FAILED 등) — 사용자에게 그대로 노출 금지
// error-codes.md의 코드를 사람이 읽을 수 있는 메시지로 변환해서 표시
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '로그인이 필요합니다',
  INQUIRY_NOT_FOUND: '문의를 찾을 수 없습니다',
  // 필요한 코드 추가
};

useMutation({
  mutationFn: ...,
  onSuccess: () => router.push('/list'),
  onError: (e) => {
    const code = e instanceof Error ? e.message : '';
    setSubmitError(ERROR_MESSAGES[code] ?? '오류가 발생했습니다');
  },
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
- 동일 상수(label map, status map)를 여러 파일에 복붙
- Redux 사용
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

**현재 구현 범위 (Scope):** DM, AI 커버 생성, 날짜 투표, 사진·앨범, 이모지 리액션 — 루트 CLAUDE.md Scope 참고.

**템플릿 이미지 경로:** `/template_images/{slug}/{filename}` (public/template_images 기준)

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
- SVG 아이콘은 인라인 JSX 또는 파일 import — 외부 아이콘 라이브러리 도입 전 팀 논의

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

## 디자인 시스템
- 토큰 SoT: `packages/tokens` (`@wara/tokens`) · 컴포넌트 SoT: `packages/ui` (`@wara/ui`) + `src/components/domain`
- 문서: @docs/design-system/03-component-system.md (인벤토리·레거시 매핑·키보드/접근성·마이그레이션 현황), @docs/design-system/01-direction.md, @docs/design-system/02-partiful-reference.md
- `src/styles/DESIGN.md`는 DEPRECATED (구 Luma 기반)
