@AGENTS.md

# WARA Web — CLAUDE.md
> 루트 CLAUDE.md와 함께 읽힘 (행동 원칙은 루트 참고)

---

## UI Boundary 규칙
- 컴포넌트 → UI 렌더링만 담당
- Hook → 상태 관리 및 비즈니스 로직 담당
- API 호출 → 컴포넌트에서 직접 수행 금지 (hook 또는 분리 레이어)

---

## 상태 관리 규칙
- 서버 상태와 클라이언트 상태 혼합 금지
- 전역 상태 최소화 (필요한 경우만 Zustand 사용)

---

## 에러 처리 규칙
- API 에러는 공통 처리 로직 사용
- 인증 에러 발생 시 → 토큰 갱신 시도 → 실패 시 강제 로그아웃

---

## Always
- API 응답 타입 → OpenAPI codegen
- Form 검증 → zod
- 페이지 lazy loading
- 검증 에러 → 필드별 표시
- 토큰 만료 → 자동 갱신 + SUSPICIOUS_REFRESH 시 강제 로그아웃

## Never
- Redux 사용 (Zustand 사용)
- 컴포넌트에 비즈니스 로직 작성 (커스텀 훅으로 분리)
- 환경변수 하드코딩
- dangerouslySetInnerHTML 사용
- 임시저장을 서버에 저장 (localStorage 1개)
- DM / AI / 날짜 투표 / 이모지 피커 UI 구현 (V1.1+)

## Refs
- @docs/api/WARA_API_설계_v0.7.md
- @docs/conventions/error-codes.md
