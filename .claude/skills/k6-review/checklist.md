# WARA K6 부하 테스트 최종 체크리스트

> K6 스크립트 작성 완료 후 PR 올리기 전 확인.
> ✅ 통과 / ❌ 미통과 / N/A 해당없음

---

## 1. 스크립트 구조

- [ ] 도메인별 시나리오가 별도 파일로 분리됐는가? (`scenarios/`)
- [ ] 인증 로직이 공통 helper로 분리됐는가? (`helpers/auth.js`)
- [ ] 메인 진입점(`load-test.js`)에서 시나리오를 조합하는 구조인가?
- [ ] README에 실행 방법이 명시됐는가?

---

## 2. 부하 시나리오

- [ ] 점진적 부하(ramp-up → sustained load → ramp-down) stages가 있는가?
- [ ] 최소 3단계(저부하 / 중부하 / 고부하)가 있는가?
- [ ] 스파이크 테스트(갑작스러운 VU 급증) 시나리오가 있는가?
- [ ] 각 시나리오에 적절한 `sleep()` 이 있어 실제 사용자 패턴을 시뮬레이션하는가?

---

## 3. 시나리오 커버리지

- [ ] 초대장 조회 (읽기 집중) 시나리오
- [ ] 참가/RSVP 변경 (쓰기 집중) 시나리오
- [ ] 사진 업로드/조회 (비용이 큰 작업) 시나리오
- [ ] 좋아요 토글 (동시성 집중) 시나리오
- [ ] 알림 조회 (폴링 패턴) 시나리오

---

## 4. 인증

- [ ] VU별로 독립적인 토큰을 사용하는가?
- [ ] 개발용 bypass 토큰 또는 실제 OAuth 흐름을 사용하는가?
- [ ] access token 만료 처리 로직이 있는가?
- [ ] 인증 실패 시 테스트가 적절히 종료/스킵되는가?

---

## 5. Threshold / SLO

- [ ] `http_req_duration p(95)` threshold가 설정됐는가?
- [ ] `http_req_failed` 에러율 threshold가 설정됐는가?
- [ ] Threshold 값이 실제 서비스 SLO와 연결됐는가? (임의 숫자 금지)
- [ ] 파일 업로드 등 느린 작업의 threshold가 별도로 설정됐는가?

---

## 6. 스크립트 품질

- [ ] API 엔드포인트 경로가 실제 라우팅과 일치하는가?
- [ ] 요청 payload가 실제 DTO 형식과 일치하는가?
- [ ] 응답 상태코드 검증(`check()`)이 있는가?
- [ ] BASE_URL이 환경변수로 분리됐는가? (하드코딩 금지)
- [ ] 에러 발생 시 로그가 충분히 남는가?

---

## 현재 브랜치 적용 현황 (feat/k6-load-test 기준)

| 항목 | 상태 | 비고 |
|------|:----:|------|
| 시나리오 파일 분리 | ✅ | scenarios/ 디렉토리 |
| auth helper 분리 | ✅ | helpers/auth.js |
| invitation 시나리오 | ✅ | scenarios/invitation.js |
| photos 시나리오 | ✅ | scenarios/photos.js |
| rsvp 시나리오 | ✅ | scenarios/rsvp.js |
| ramp-up stages | ⚠️ | 확인 필요 |
| Threshold 설정 | ⚠️ | 확인 필요 |
| VU별 독립 토큰 | ⚠️ | 확인 필요 |
| check() 응답 검증 | ⚠️ | 확인 필요 |
| BASE_URL 환경변수 | ⚠️ | 확인 필요 |
| README 실행 방법 | ✅ | k6/README.md 존재 |
| 알림 시나리오 | ❌ | 미구현 — 추가 필요 여부 검토 |
