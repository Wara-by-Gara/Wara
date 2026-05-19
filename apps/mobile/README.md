# @wara/mobile

와라 모바일 앱 (Expo SDK 54 · Expo Router · TypeScript).

> 작업 규칙은 [`CLAUDE.md`](./CLAUDE.md) 참고.

## Get started

루트에서 의존성 설치:

```bash
pnpm install
```

환경변수 (최초 1회):

```bash
cp apps/mobile/.env.example apps/mobile/.env
# .env에서 EXPO_PUBLIC_API_URL을 본인 환경에 맞게 수정 (기본: http://localhost:3000/api/v1)
```

mobile dev 서버:

```bash
pnpm --filter @wara/mobile start
```

플랫폼별:

```bash
pnpm --filter @wara/mobile ios       # iOS Simulator
pnpm --filter @wara/mobile android   # Android Emulator
pnpm --filter @wara/mobile web       # Web 미리보기
```

## Scripts

| Script | 설명 |
|--------|------|
| `dev` / `start` | Expo dev server (turbo 통합용 `dev`, 단독 사용용 `start`) |
| `ios` / `android` / `web` | 플랫폼별 dev server |
| `lint` | `expo lint` |
| `typecheck` | `tsc --noEmit` |

## API 클라이언트 사용

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/src/api';

// 조회
const { data, isPending, error } = useQuery({
  queryKey: ['invitations', 'me'],
  queryFn: ({ signal }) => apiFetch<InvitationDto[]>('/invitations', { signal }),
});

// 변경
const queryClient = useQueryClient();
const rsvp = useMutation({
  mutationFn: (status: string) =>
    apiFetch(`/invitations/${id}/participants/me/rsvp`, {
      method: 'PATCH',
      body: { rsvpStatus: status },
    }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations'] }),
});
```

에러는 `WaraApiError`(`error.code`로 분기) 또는 `WaraNetworkError`로 throw됩니다.
JWT 토큰은 `getAccessToken / setTokens / clearTokens`로 SecureStore 관리.

## Refs

- Expo SDK 54: https://docs.expo.dev/versions/v54.0.0/
- Expo Router: https://docs.expo.dev/router/introduction
- pnpm monorepo + Expo: https://docs.expo.dev/guides/monorepos/
- TanStack Query: https://tanstack.com/query/v5/docs/framework/react/overview
