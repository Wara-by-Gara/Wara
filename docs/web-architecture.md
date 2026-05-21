# WARA 웹앱 아키텍처 가이드

> 이 문서는 `apps/web/CLAUDE.md`를 사람이 읽기 좋게 정리한 설명 문서입니다.
> LLM과 개발자 모두가 이해할 수 있도록 준비했습니다.

---

## 📋 목차

1. [이 문서가 필요한 이유](#이-문서가-필요한-이유)
2. [기술 스택](#기술-스택)
3. [폴더 구조](#폴더-구조)
4. [데이터 흐름](#데이터-흐름)
5. [핵심 규칙 요약](#핵심-규칙-요약)
6. [자주 하는 실수](#자주-하는-실수)

---

## 이 문서가 필요한 이유

팀원들이 코드를 작성할 때 **같은 패턴을 일관되게 사용**해야 합니다.
만약 누군가는 `src/features/invitations/api.ts`에, 다른 누군가는 `src/lib/api/invitations.ts`에 코드를 쓰면?
→ 코드 리뷰, 유지보수, 새로운 팀원의 온보딩이 어려워집니다.

이 문서는 **"WARA 웹앱에서는 이렇게 한다"**를 명확히 하기 위해 만들었습니다.

---

## 기술 스택

### 설치되어 있는 것

| 역할 | 라이브러리 | 버전 | 비고 |
|---|---|---|---|
| 프레임워크 | Next.js 15 | 15.x | App Router, `output: "standalone"` |
| UI 런타임 | React | 19.x | Hooks 베이스 |
| 서버 상태 | TanStack React Query | 5.x | API 데이터 캐싱 |
| 전역 상태 | Zustand | 5.x | UI 상태 관리 (예: 로그인 여부, 알림 카운트) |
| 스타일링 | Tailwind CSS | 4.x | CSS-native config |
| 아이콘 | Lucide React | 최신 | SVG 아이콘 |
| 유틸 | clsx, tailwind-merge | - | `cn()` 함수로 래핑됨 |

### 설치되어 있지만 미사용

- **Zod v4** — 현재 HTML5 native validation 사용 중

### 설치되지 않음 (도입 전 팀 논의 필요)

- **react-hook-form** — 복잡한 폼 validation 필요할 때 검토
- **OpenAPI codegen** — 자동 타입 생성 필요할 때 검토

---

## 폴더 구조

```
src/
├── app/                  # Next.js 라우팅
│   ├── (not-header)/     # 헤더 없는 페이지 (로그인 등)
│   │   └── login/
│   ├── (with-header)/    # 헤더 있는 페이지 (대부분)
│   │   ├── admin/
│   │   ├── edit/
│   │   ├── invitations/
│   │   └── profile/
│   └── layout.tsx        # 루트 레이아웃 (전역 Provider)
│
├── domain/               # 도메인별 UI 컴포넌트
│   └── [Domain]/
│       └── [SubComponent]/  # 예: InvitationList/Card/
│
├── hooks/                # React Query hooks
│   ├── useInvitations.ts
│   ├── usePhotos.ts
│   └── ...
│
├── lib/
│   ├── api/
│   │   ├── client.ts     # HTTP 클라이언트 (fetch 진입점)
│   │   ├── invitations.ts # 도메인별 API 함수
│   │   └── ...
│   ├── utils.ts          # cn() 유틸
│   ├── error-messages.ts # 에러 코드 → 사용자 메시지 변환
│   └── jwt.ts            # 토큰 관리
│
├── constants/
│   ├── queryKeys.ts      # QUERY_KEYS (React Query 키)
│   └── routes.ts         # ROUTES (라우트 상수)
│
├── stores/               # Zustand 전역 상태
│   ├── authStore.ts      # 로그인 상태
│   └── notificationStore.ts # 알림 카운트
│
└── providers/
    └── index.tsx         # QueryClientProvider
```

### 핵심 원칙

#### 1️⃣ 도메인별 API 함수는 `lib/api/[domain].ts`에

```ts
// ✅ src/lib/api/invitations.ts
export function getInvitation(id: string) {
  return apiGet<Invitation>(`/invitations/${id}`);
}

export function createInvitation(payload: CreateInput) {
  return apiPost<Invitation>('/invitations', payload);
}
```

#### 2️⃣ React Query hooks는 `hooks/use[Domain].ts`에

```ts
// ✅ src/hooks/useInvitations.ts
import { getInvitation, createInvitation } from '@/lib/api/invitations';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useInvitation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.detail(id),
    queryFn: () => getInvitation(id),
  });
}
```

#### 3️⃣ Query 키는 중앙집중식 `QUERY_KEYS` 사용

```ts
// ✅ src/constants/queryKeys.ts에 미리 정의되어 있음
import { QUERY_KEYS } from '@/constants/queryKeys';

queryKey: QUERY_KEYS.invitations.all()        // 목록 전체
queryKey: QUERY_KEYS.invitations.detail(id)   // 상세 페이지
queryKey: QUERY_KEYS.notifications.unread()   // 읽지 않은 알림
```

#### 4️⃣ 라우트도 중앙집중식 `ROUTES` 상수 사용

```ts
// ✅ src/constants/routes.ts에 미리 정의되어 있음
import { ROUTES } from '@/constants/routes';

router.push(ROUTES.INVITATIONS.DETAIL(id))  // /invitations/id
router.push(ROUTES.PROFILE.ME)              // /profile
```

#### 5️⃣ 공통 타입은 `@wara/types` 워크스페이스 패키지에서

```ts
// ✅ 워크스페이스 패키지에서 import
import type { Invitation, User } from '@wara/types';

// ❌ src/types/ 폴더 생성 금지
```

---

## 데이터 흐름

### 전형적인 초대장 목록 페이지 예시

```
┌─────────────────────────────────────────────────────────┐
│ 1. 사용자가 /invitations 페이지 방문                    │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ 2. app/invitations/page.tsx가 렌더링됨                  │
│    → useInvitations() 훅 호출                           │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ 3. src/hooks/useInvitations.ts                          │
│    → React Query useQuery 생성                          │
│    → queryKey: QUERY_KEYS.invitations.all()             │
│    → queryFn: getInvitation() 지정                      │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ 4. src/lib/api/invitations.ts                           │
│    → getInvitations() 함수 실행                         │
│    → apiGet<Invitation[]>('/invitations') 호출          │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ 5. src/lib/api/client.ts                               │
│    → fetch(API_URL/invitations)                         │
│    → Authorization 헤더 주입 (localStorage에서)         │
│    → { success: true, data: [...] } 응답 처리          │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ 6. React Query 캐시에 저장                              │
│    → QUERY_KEYS.invitations.all() 키로 저장            │
│    → 컴포넌트 리렌더링                                  │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ 7. domain/InvitationList/Card/index.tsx                │
│    → 초대장 카드 렌더링                                 │
└─────────────────────────────────────────────────────────┘
```

### 핵심 포인트

- **컴포넌트는 훅을 호출**한다. API를 직접 호출하지 않는다.
- **훅은 React Query로 상태를 관리**한다.
- **API 함수는 순수하게 fetch만 담당**한다.
- **캐시 키는 중앙집중식**으로 관리되어 코드 분산을 방지한다.

---

## 상태 관리 전략

### React Query (서버 상태)

**언제:** API에서 받은 데이터 (초대장 목록, 프로필 정보 등)

```ts
// ✅ 서버 상태는 React Query만 사용
const { data: invitations } = useQuery({
  queryKey: QUERY_KEYS.invitations.all(),
  queryFn: getInvitations,
});
```

### Zustand (전역 UI 상태)

**언제:** 여러 페이지에서 필요한 UI 상태 (로그인 여부, 알림 카운트)

```ts
// ✅ 전역 UI 상태는 Zustand
const { isLoggedIn } = useAuthStore();
const { unreadCount } = useNotificationStore();
```

### useState (로컬 상태)

**언제:** 단일 컴포넌트 내 상태 (모달 열림/닫힘, 폼 입력값)

```ts
// ✅ 로컬 UI 상태는 useState
const [isModalOpen, setIsModalOpen] = useState(false);
const [form, setForm] = useState({ title: '', content: '' });
```

### ❌ 하면 안 되는 것

```ts
// ❌ React Query 캐시를 Zustand에 복사
set({ invitations: queryData });

// ❌ Zustand 값을 useState로 복사
const [loggedIn, setLoggedIn] = useState(isLoggedIn);

// ❌ Store 간 직접 참조
useAuthStore().logout();  // authStore에서 다른 store 호출
```

---

## 핵심 규칙 요약

| 상황 | 해야 할 것 | 하면 안 되는 것 |
|---|---|---|
| 라우트 변경 | `router.push(ROUTES.INVITATIONS.DETAIL(id))` | `router.push('/invitations/' + id)` |
| Query 키 | `QUERY_KEYS.invitations.detail(id)` | `['invitations', id]` (직접 정의) |
| API 호출 | `getInvitations()` (from lib/api/) | 컴포넌트에서 직접 fetch |
| Hook 호출 | 컴포넌트에서 `useInvitations()` | 유틸 함수에서 hook 호출 |
| 공통 타입 | `import type { Invitation } from '@wara/types'` | `src/types/common.ts` 생성 |
| 아이콘 | `<IconName /> from lucide-react` | SVG 파일 직접 import (간단한 경우만) |
| 캐시 갱신 | `invalidateQueries()` 또는 `setQueryData()` | 수동으로 state 업데이트 |

---

## 자주 하는 실수

### 1️⃣ 라우트 문자열 하드코딩

```ts
// ❌ 나쁜 예
router.push(`/invitations/${id}`);

// ✅ 좋은 예
import { ROUTES } from '@/constants/routes';
router.push(ROUTES.INVITATIONS.DETAIL(id));
```

**왜?** 나중에 라우트 구조가 바뀌었을 때 모든 파일을 수정해야 함.

---

### 2️⃣ API 호출을 컴포넌트에서 직접 수행

```ts
// ❌ 나쁜 예
export default function InvitationList() {
  const [invitations, setInvitations] = useState([]);
  
  useEffect(() => {
    apiGet('/invitations').then(data => setInvitations(data));
  }, []);
  
  return <div>{invitations.map(...)}</div>;
}

// ✅ 좋은 예
export default function InvitationList() {
  const { data: invitations } = useInvitations();
  return <div>{invitations?.map(...)}</div>;
}
```

**왜?** 
- 캐싱을 놓친다
- 자동 갱신이 안 된다
- 같은 데이터를 여러 곳에서 다르게 관리한다

---

### 3️⃣ 동일한 상수를 여러 파일에 복사

```ts
// ❌ 나쁜 예: 여러 파일에 같은 내용
// file1.ts
const STATUS_LABELS = { pending: '대기', resolved: '완료' };

// file2.ts
const STATUSES = { pending: '대기', resolved: '완료' };  // 복사본!

// ✅ 좋은 예: 한 곳에 정의하고 import
// src/constants/queryKeys.ts
export const QUERY_KEYS = { ... };

// 모든 파일에서
import { QUERY_KEYS } from '@/constants/queryKeys';
```

**왜?** 나중에 한쪽만 수정되어 불일치 발생.

---

### 4️⃣ Query Key를 뜻대로 정의

```ts
// ❌ 나쁜 예: 저마다 다르게 정의
// hooks/useInvitations.ts
const invitationKeys = { all: ['invitations'] };

// hooks/usePhotos.ts
const photoKeys = { all: ['photos'] };  // 명칭, 구조 다름!

// ✅ 좋은 예: 중앙에서 관리
// src/constants/queryKeys.ts
export const QUERY_KEYS = {
  invitations: { all: () => [...], detail: (id) => [...] },
  photos: { all: () => [...], detail: (id) => [...] },
};
```

**왜?** React Query DevTools, 캐시 무효화 전략이 복잡해짐.

---

### 5️⃣ React Query 캐시를 Zustand에 복사

```ts
// ❌ 나쁜 예
const { data } = useQuery({...});
set({ invitations: data });  // 복사!

// ✅ 좋은 예
const { data: invitations } = useQuery({...});
// React Query에서만 관리
```

**왜?** 캐시와 Zustand가 불일치됨. 어디가 source of truth인지 불명확.

---

## 더 알아보기

- `apps/web/CLAUDE.md` — 상세 규칙 (LLM 대상)
- `src/constants/queryKeys.ts` — 전체 Query Key 정의
- `src/constants/routes.ts` — 전체 라우트 상수

---

**마지막으로:** 이 문서가 변경되면 팀 Slack / 회의에서 공유해주세요!
