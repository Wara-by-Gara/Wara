@AGENTS.md

# WARA Mobile — CLAUDE.md
> 루트 CLAUDE.md와 함께 읽힘 (행동 원칙은 루트 참고)
> Expo SDK 54 — 코드 작성 전 https://docs.expo.dev/versions/v54.0.0/ 확인

---

## 플랫폼
- **iOS 전용** (`app.json` `platforms: ["ios"]`). Android/web 타깃은 제거됨 — Android/web 분기 코드·설정 추가 금지.
- 디자인 방향: **완전 iOS 네이티브 룩** (SF 폰트·SF Symbols·iOS 시스템 시맨틱 컬러·네이티브 컴포넌트). 글로벌 틴트 = `systemBlue`.

## Scope (전체 기능 — new_plan.md 로드맵 기준)
- 인증: 소셜 로그인 (카카오·네이버·구글·애플)
- 초대장: 목록 / 상세 / 생성 / 수정 / 공유(BGM·비밀번호 보호)
- 참가자: RSVP, 역할(호스트/공동호스트), 차단·제거
- 일정: 날짜 투표, 확정
- 위치: 모임 장소 표시, 내 위치 공유, 프라이버시 티어
- 사진: 업로드(presigned) / 좋아요 / 댓글 / 베스트 / 지도
- 소통: 그룹 DM, 1:1 DM, 활동 피드, 공지
- 알림 (in-app + Expo push), AI 커버, 리마인드·재모임, 친구, 공개초대장 탐색, 비용정산, 고객센터
- 어드민은 모바일 제외
- 단계별 진행: `~/.claude/plans/new-plan-md-mutable-flask.md` 로드맵 참고

---

## Always
- API 호출은 **`api/`의 `apiFetch` + TanStack Query 훅**을 사용 (직접 `fetch()` 금지)
  - `useQuery({ queryKey, queryFn: ({ signal }) => apiFetch<T>(path, { signal }) })`
  - mutation은 `useMutation` + `queryClient.invalidateQueries` 패턴
- 응답 envelope는 `apiFetch`가 풀어서 `data`만 반환, 실패는 `WaraApiError`로 throw
- 에러 처리는 `error.code`(docs/conventions/error-codes.md 기준)로 분기 — message 그대로 노출 금지
- JWT 토큰은 `api/auth-storage`의 `getAccessToken/setTokens/clearTokens` 사용 (SecureStore)
- 환경 변수: `EXPO_PUBLIC_API_URL` → `app.config.ts` extra로 노출 → `Constants.expoConfig.extra.apiUrl`
- 화면 라우팅은 Expo Router (file-based, `app/` 디렉터리)
- **IA·화면 구성·플로우·카피는 웹과 패리티 유지, 시각 표현은 iOS 네이티브로 모바일 소유**:
  - 정보 구조("무엇을 어떤 순서로 보여주는가")는 웹과 통일 — 패리티 매트릭스(`docs/parity/web-mobile-parity.md`) 기준.
  - **앱 크롬**(네비게이션·탭·리스트·설정·시트·폼 컨트롤·텍스트/배경) → `theme/`의 iOS 네이티브 토큰
    (`import { ios, iosType, iosMetrics } from '@/theme'`). 컬러는 `PlatformColor` 기반 시스템 시맨틱.
  - **초대장 콘텐츠/캔버스** → 초대장 자체의 시각 정체성. 필요 시 hex 사용 가능하나 iOS 톤 유지.
  - 컴포넌트 룩·타이포·컬러("어떻게 그리는가")는 iOS HIG 기준으로 mobile이 결정.
- 재사용 UI는 `components/ios/*`의 네이티브 컴포넌트 킷을 우선 사용 (grouped List, Button, BottomSheet 등)
- **`@expo/ui`·`expo-glass-effect` 직접 import 금지** — 반드시 `components/ios/*` 래퍼 경유 (베타 API 파손 변경 격리)
- 모든 외부 입력은 Zod 등으로 검증 (서버에서 이미 검증해도 클라 안전망)

## Never
- **앱 크롬 코드에 hex/`rgba(...)` 직접 사용 금지** — `theme/`의 `PlatformColor` 시맨틱 토큰 사용
  (Reanimated worklet·Kakao WebView·초대장 캔버스 경계는 예외 — `theme`의 hex fallback 사용)
- `console.log` 커밋 (대신 디버그 도구 / Sentry 사용)
- `any` 타입 사용 (`@typescript-eslint/no-explicit-any` warn 적용 중)
- 환경 변수 하드코딩 (.env.* 또는 EAS Secret만)
- Android/web 전용 분기·설정 추가 (iOS 전용 앱)
- Scope 밖 기능 임의 추가 (new_plan.md 로드맵 참고)

## 모노레포 / 빌드 메모
- pnpm workspace — root `pnpm install` 한 번이면 전체 deps 정렬
- `metro.config.js`에서 workspace root watch + pnpm symlink 회피 설정 적용 중
- Expo SDK 잠금 의존성은 `~`(마이너 잠금) 유지, 임의 업그레이드 금지

## Refs
- @docs/api/api.md
- @docs/conventions/error-codes.md
- https://docs.expo.dev/versions/v54.0.0/
- https://docs.expo.dev/guides/monorepos/
