# 02. 모노레포 구조

> "왜 한 저장소에 백엔드·프론트·모바일을 다 넣었지?"

---

## 1. 모노레포 vs 멀티레포

### 모노레포 (한 저장소)
- 백엔드 API 시그니처가 바뀌면 프론트도 같은 PR에서 수정
- 공유 타입/설정을 `packages/`로 분리하면 모든 앱이 import
- CI 한 번에 typecheck/lint/test

### 멀티레포 (저장소 분리)
- 팀별 권한 분리, 릴리스 사이클 분리에 유리
- 공유 코드는 npm 패키지로 게시해야 → 버전 동기화 지옥

**WARA**는 1~3인 소규모 팀이라 모노레포가 유리. 백엔드 변경이 프론트로 즉시 전파되는 게 더 큰 가치.

→ 도구는 **pnpm workspace + Turbo**.

---

## 2. pnpm workspace

**파일**: `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"        # apps/api, apps/web, apps/mobile
  - "packages/*"    # packages/tsconfig, packages/eslint-config
allowBuilds:
  '@nestjs/core': true
  esbuild: true
  sharp: true
  unrs-resolver: true
```

### 핵심 개념

#### (1) 단일 `node_modules` (호이스팅)
pnpm은 의존성을 글로벌 스토어(`~/.pnpm-store`)에 한 번 설치하고, 각 프로젝트 `node_modules`엔 **심볼릭 링크**만 만든다. 디스크 절약 + 설치 속도.

#### (2) workspace 의존성
앱 간에 패키지를 의존할 때 `workspace:*` protocol을 쓴다.

`apps/web/package.json`:
```json
"devDependencies": {
  "@wara/eslint-config": "workspace:*",
  "@wara/tsconfig": "workspace:*"
}
```

→ `pnpm install`이 npm registry로 가지 않고, 같은 저장소의 `packages/tsconfig`로 심볼릭 링크. **수정 즉시 반영**.

#### (3) `allowBuilds`
pnpm은 보안상 임의 패키지의 postinstall 스크립트를 막는다. 빌드가 필요한 의존성(sharp 등)만 명시적으로 허용.

### 자주 쓰는 명령

```bash
pnpm install                    # 전체 워크스페이스 설치
pnpm --filter @wara/api dev     # 특정 앱만 dev
pnpm --filter @wara/web build   # 특정 앱만 빌드
pnpm -r typecheck               # 모든 워크스페이스에서 typecheck
```

`-r` = recursive (모든 워크스페이스), `--filter`는 패키지 이름 또는 경로 필터.

---

## 3. Turbo (빌드 오케스트레이터)

**파일**: `turbo.json`

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "typecheck": { "dependsOn": ["^typecheck"], "outputs": [] },
    "lint":      { "dependsOn": ["^lint"], "outputs": [] },
    "test":      { "dependsOn": ["build"], "inputs": ["src/**", "test/**"], "outputs": ["coverage/**"] },
    "dev":       { "cache": false, "persistent": true }
  }
}
```

### `dependsOn`의 `^` 표시
`^build`는 "**이 패키지가 의존하는 다른 패키지들의 `build`가 먼저 끝나야 한다**"는 뜻.

→ `@wara/api`가 `@wara/tsconfig`에 의존하면, api의 build 전에 tsconfig의 build가 먼저. (실제로 tsconfig는 build가 없어서 즉시 스킵.)

### 캐시
`outputs`로 지정된 파일이 변경되지 않은 입력에 대해 같으면, Turbo가 결과를 캐시.

→ CI에서 같은 commit으로 다시 돌리면 거의 즉시 끝남.

### `dev`에 `cache: false, persistent: true`
- `cache: false`: dev는 매번 새로 (캐시할 게 없음)
- `persistent: true`: dev는 무한 실행 (Turbo가 다음 작업으로 안 넘어감)

### 자주 쓰는 명령
```bash
pnpm dev          # turbo run dev — 모든 앱 dev 동시 실행
pnpm build        # turbo run build — 모든 앱 빌드
pnpm typecheck    # 모든 앱 typecheck (Turbo가 병렬화)
```

루트 `package.json:7`:
```json
"scripts": {
  "build": "turbo run build",
  "dev": "turbo run dev",
  "lint": "turbo run lint",
  "test": "turbo run test"
}
```

---

## 4. `packages/` — 공유 코드

### `packages/tsconfig`
**역할**: 모든 앱이 상속받는 TS 베이스 설정.

각 앱 `tsconfig.json`이 이걸 `extends`:
```jsonc
{
  "extends": "@wara/tsconfig/base.json",
  // 앱 고유 옵션 추가
}
```

### `packages/eslint-config`
ESLint 공통 규칙. 각 앱이 `import` 해서 적용.

### 패키지를 더 만들고 싶을 때
1. `packages/foo/package.json` 만들고 `"name": "@wara/foo"`
2. 다른 앱의 `package.json`에 `"@wara/foo": "workspace:*"` 추가
3. `pnpm install`로 심볼릭 링크 생성

> **언제 새 패키지를 만들까**: 2개 이상 앱에서 정말 공유될 때만. 1개 앱만 쓰면 그냥 그 앱 안에 두는 게 깔끔.

---

## 5. `apps/`

### `apps/api` — NestJS 백엔드
- `src/main.ts` 부트스트랩
- `src/app.module.ts`가 루트 모듈
- `src/<domain>/` 형식으로 도메인 모듈 40개 가까이

### `apps/web` — Next.js 15
- App Router (`src/app/`)
- `src/domain/` 도메인 훅·API 함수
- `src/lib/` 유틸 (apiClient, jwt 등)

### `apps/mobile` — React Native + Expo
- iOS, Android 동시 지원

---

## 6. `docs/` — 단일 진실의 원천 (SoT)

코드보다 **문서가 먼저** 가는 항목:
- `docs/api/WARA_API_설계_v0.7.md` — API 스펙
- `docs/db/WARA_ERD_v0.6.1.md` — DB ERD
- `docs/conventions/error-codes.md` — 에러 코드 표
- `docs/legal/*.md` — 약관 본문 (DB seed의 SoT)
- `docs/decisions/` — ADR (의사결정 기록)

→ 신규 API를 만들면 `docs/api/` 명세부터 본다 (루트 CLAUDE.md 규칙).

---

## 7. 흔한 함정

### `pnpm install`을 앱 디렉터리에서 실행
```bash
cd apps/api && pnpm install   # ❌
```
워크스페이스 관계가 깨질 수 있음. 항상 루트에서.

### `package.json` 손으로 편집 후 `pnpm install` 안 함
심볼릭 링크 갱신이 안 되어 import가 깨짐. 의존성 추가 후엔 반드시 install.

### `node_modules/.bin/` 명령 직접 호출
`./node_modules/.bin/nest`처럼 부르지 말고 `pnpm nest` 또는 워크스페이스 스크립트(`pnpm --filter @wara/api dev`)로.

---

## 8. 체크리스트

- [ ] `pnpm-workspace.yaml`이 뭘 하는지 안다
- [ ] `workspace:*` 의존성을 설명할 수 있다
- [ ] Turbo의 `^build` 표시가 무슨 뜻인지 안다
- [ ] `pnpm --filter @wara/api dev` 형식 명령을 쓸 수 있다
- [ ] `apps/` `packages/` `docs/`의 역할을 안다

→ 다음: [03. NestJS 기본기](./03-nestjs-basics.md)
