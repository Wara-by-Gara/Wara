# @wara/mobile

와라 모바일 앱 (Expo SDK 54 · Expo Router · TypeScript).

> 작업 규칙은 [`CLAUDE.md`](./CLAUDE.md) 참고.

## Get started

루트에서 의존성 설치:

```bash
pnpm install
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
| `start` | Expo dev server |
| `ios` / `android` / `web` | 플랫폼별 dev server |
| `lint` | `expo lint` |
| `typecheck` | `tsc --noEmit` |

## Refs

- Expo SDK 54: https://docs.expo.dev/versions/v54.0.0/
- Expo Router: https://docs.expo.dev/router/introduction
- pnpm monorepo + Expo: https://docs.expo.dev/guides/monorepos/
