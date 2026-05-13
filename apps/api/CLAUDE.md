# WARA API — CLAUDE.md
> 루트 CLAUDE.md와 함께 읽힘 (행동 원칙은 루트 참고)

---

## Error Handling 규칙
- 에러는 Service에서 domain 단위로 발생
- Controller에서 HTTP 응답 형태로 변환
- 임의의 에러 포맷 생성 금지 (error-codes.md 기준)

---

## 변경 안전성
- endpoint 추가 시 → 반드시 @docs/api/WARA_API_설계_v0.7.md 명세 확인
- 기존 API 수정 시 → response 구조 변경 금지 (breaking change 방지)
- 영향 범위 명시 필수

---

## Always
- Controller → Service → Repository 레이어 순서 준수
- Controller에서 비즈니스 로직 금지 → Service로 위임
- DB 접근은 Repository에서만 → Service에서 직접 DB 접근 금지
- Controller에서 비즈니스 로직 금지 → Service로 위임
- DTO에 class-validator 필수
- 권한 검증은 Guard로
- 응답 구조 통일: 성공 `{ success, data, meta }` / 실패 `{ success, error, meta }`
- 에러 응답 → @docs/conventions/error-codes.md 형식 준수
- Soft delete = `deleted_at`
- 복합 조회 (초대장 상세, 호스트 대시보드 등) → GraphQL
- 변경 작업 (POST / PATCH / DELETE) → REST

## Never
- raw SQL 직접 작성 (Drizzle query builder 사용)
- Service ↔ Service 직접 호출
- @Body() 그대로 DB에 저장
- Google OAuth 구현 (V1.0 소셜 로그인: kakao / naver / apple만)
- DM / AI / 날짜 투표 / Album / PhotoView 코드 작성 (V1.1+)

## Refs
- @docs/api/WARA_API_설계_v0.7.md
- @docs/conventions/error-codes.md
