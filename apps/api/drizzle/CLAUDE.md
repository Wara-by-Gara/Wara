# WARA DB — CLAUDE.md
> 루트 CLAUDE.md와 함께 읽힘 (행동 원칙은 루트 참고)

---

## Data Integrity 규칙
- 모든 write는 데이터 일관성 유지 기준 충족해야 함
- FK / 참조 관계 무결성 깨는 변경 금지
- ID 생성 규칙 (ULID) 위반 금지

---

## 변경 안전성
- migration 작성 시 → SQL 반드시 검토 후 실행
- 기존 컬럼 수정 시 → nullable / default / 영향 범위 명시 필수
- 컬럼 삭제 시 → 사용 여부 확인 없이 삭제 금지

---

## Always
- ID = ULID
- 모든 테이블에 created_at, updated_at
- snake_case (Drizzle casing 자동 적용)
- migration 순서: 스키마 수정 → db:generate → SQL 검토 → db:migrate

## Never
- migration 없이 스키마 직접 수정
- hard delete (soft delete 사용)
- 평문 비밀번호 저장 (bcrypt 사용)
- raw SQL 직접 작성 (Drizzle query builder 사용)
- V1.1+ 테이블 V1.0에 생성 (dm / ai / albums / photo_views / photo_emojis)
- migration 파일 자동 실행 (SQL 검토 후 수동 실행)

## Refs
- @docs/db/WARA_ERD_v0.6.1.md
- @docs/conventions/error-codes.md
