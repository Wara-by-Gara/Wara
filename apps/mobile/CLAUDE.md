@AGENTS.md

# WARA Mobile — CLAUDE.md
> 루트 CLAUDE.md와 함께 읽힘 (행동 원칙은 루트 참고)
> Expo SDK 54 — 코드 작성 전 https://docs.expo.dev/versions/v54.0.0/ 확인

---

## V1.0 화면 범위
- 인증: kakao / naver / apple 소셜 로그인 (Google 금지)
- 초대장: 목록 / 상세 / 생성 / 수정
- 참가자: RSVP, 차단 목록
- 위치: 모임 장소 표시, 내 위치 공유 (필요 시)
- 사진: 업로드 / 좋아요
- 미션
- 피드백
- 알림 (in-app + push)

## V1.1+ 금지 (구현 금지)
- DM
- AI 추천
- 날짜 투표
- 앨범
- 사진 조회 통계 (PhotoView)
- 이모지 반응
- 체류 시간 분석

---

## Always
- API 호출은 **`src/api`의 `apiFetch` + TanStack Query 훅**을 사용 (직접 `fetch()` 금지)
  - `useQuery({ queryKey, queryFn: ({ signal }) => apiFetch<T>(path, { signal }) })`
  - mutation은 `useMutation` + `queryClient.invalidateQueries` 패턴
- 응답 envelope는 `apiFetch`가 풀어서 `data`만 반환, 실패는 `WaraApiError`로 throw
- 에러 처리는 `error.code`(docs/conventions/error-codes.md 기준)로 분기 — message 그대로 노출 금지
- JWT 토큰은 `src/api/auth-storage`의 `getAccessToken/setTokens/clearTokens` 사용 (SecureStore)
- 환경 변수: `EXPO_PUBLIC_API_URL` → `app.config.ts` extra로 노출 → `Constants.expoConfig.extra.apiUrl`
- 화면 라우팅은 Expo Router (file-based, `app/` 디렉터리)
- 컴포넌트 styling은 RN `StyleSheet.create` 또는 Themed 컴포넌트
- 모든 외부 입력은 Zod 등으로 검증 (서버에서 이미 검증해도 클라 안전망)

## Never
- `console.log` 커밋 (대신 디버그 도구 / Sentry 사용)
- `any` 타입 사용 (`@typescript-eslint/no-explicit-any` warn 적용 중)
- 환경 변수 하드코딩 (.env.* 또는 EAS Secret만)
- Google OAuth 연동 (V1.0 소셜 로그인: kakao / naver / apple만)
- V1.1+ 기능 화면·코드 작성

## 모노레포 / 빌드 메모
- pnpm workspace — root `pnpm install` 한 번이면 전체 deps 정렬
- `metro.config.js`에서 workspace root watch + pnpm symlink 회피 설정 적용 중
- Expo SDK 잠금 의존성은 `~`(마이너 잠금) 유지, 임의 업그레이드 금지

## Refs
- @docs/api/api.md
- @docs/conventions/error-codes.md
- https://docs.expo.dev/versions/v54.0.0/
- https://docs.expo.dev/guides/monorepos/
