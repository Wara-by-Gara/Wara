---
name: k6-review
description: >
  Use this skill to review K6 load test scripts for correctness, scenario coverage,
  and network bottleneck detection.
  Triggers include: K6 점검, 부하 테스트, 성능 테스트, 네트워크 병목, 점진적 부하, load test 리뷰,
  k6 스크립트, thresholds, VU, ramp-up.
  Always verify that test scenarios match actual API endpoints and auth flows.
---

# K6 Load Test Review Skill (WARA)

부하 테스트 스크립트가 실제 운영 시나리오를 정확히 시뮬레이션하는지 검증한다.
스크립트 오류보다 "어떤 시나리오를 놓쳤는가"에 집중한다.

---

## 원칙

- 실제 API 엔드포인트 경로, 요청 형식과 스크립트가 일치해야 한다
- 인증 흐름(로그인 → access token → 요청)이 정확히 구현됐는지 확인
- Threshold가 실제 SLO와 연결됐는지 확인 (임의 숫자 금지)
- 점진적 부하(ramp-up → sustained → ramp-down) 패턴이 있어야 한다

---

## Workflow

### Phase 1 — 스크립트 구조 검토

```bash
ls k6/
cat k6/load-test.js
```

**체크 항목:**

| 항목 | 기준 |
|------|------|
| 시나리오 분리 | 도메인별 시나리오가 별도 파일로 분리됐는가 |
| 인증 헬퍼 | 토큰 발급/갱신 로직이 공통 helper로 분리됐는가 |
| 점진적 부하 | `stages` 또는 `executor` 설정으로 ramp-up이 있는가 |
| Threshold | `http_req_duration`, `http_req_failed` 등 SLO 기준이 있는가 |

---

### Phase 2 — 시나리오 커버리지

```bash
grep -n "http.get\|http.post\|http.patch\|http.del\|http.put" k6/**/*.js
```

**WARA 핵심 시나리오 목록:**

| 시나리오 | 엔드포인트 | 부하 특성 |
|----------|-----------|-----------|
| 초대장 목록 조회 | GET /invitations | 읽기 집중, 고빈도 |
| 초대장 상세 조회 | GET /invitations/:id | 읽기 집중 |
| 참가자 목록 조회 | GET /invitations/:id/participants | 읽기 집중 |
| 미션 목록 조회 | GET /invitations/:id/missions | 읽기 집중 |
| RSVP 변경 | PATCH /invitations/:id/participants/me/rsvp | 쓰기, 동시 집중 |
| 사진 업로드 (presigned) | POST /invitations/:id/photos | 쓰기, 비용 큰 작업 |
| 좋아요 토글 | POST/DELETE /invitations/:id/photos/:photoId/likes | 동시 집중 |
| 알림 조회 | GET /notifications | 폴링 패턴 |

---

### Phase 3 — 인증 흐름 검증

```bash
cat k6/helpers/auth.js
```

**체크 항목:**

- [ ] 실제 OAuth 엔드포인트 또는 개발용 bypass 엔드포인트를 사용하는가?
- [ ] access token 만료 시 재발급(refresh) 로직이 있는가?
- [ ] VU별로 독립적인 토큰을 사용하는가? (공유 토큰은 race condition 유발)
- [ ] 토큰 발급 실패 시 테스트가 중단되지 않고 처리되는가?

---

### Phase 4 — Threshold / SLO 검증

```bash
grep -n "thresholds\|http_req_duration\|http_req_failed\|error_rate" k6/**/*.js
```

**권장 Threshold:**

| 메트릭 | 권장 기준 |
|--------|-----------|
| `http_req_duration p(95)` | < 500ms (일반 API) |
| `http_req_duration p(99)` | < 1000ms |
| `http_req_failed` | < 1% (에러율) |
| `http_req_duration p(95)` (파일 업로드) | < 3000ms |

---

### Phase 5 — 네트워크 병목 탐지 포인트

**부하 테스트에서 발견해야 할 패턴:**

| 증상 | 원인 추정 | 확인 방법 |
|------|-----------|-----------|
| p95 지연 급증 | DB 쿼리 슬로우, 인덱스 없음 | `http_req_duration` trend |
| 에러율 급증 | Rate limiting, 커넥션 풀 고갈 | `http_req_failed` rate |
| 특정 VU 수에서 성능 저하 | DB 커넥션 풀 한계 | VU별 응답시간 분포 |
| 첫 요청 느림 | Cold start, 캐시 미스 | 시나리오 초반 duration |

---

## 출력 형식

```
## K6 부하 테스트 점검 결과

### 시나리오 커버리지
| 시나리오 | 구현 여부 | 비고 |

### 스크립트 이슈
| # | 심각도 | 파일 | 문제 | 수정 방향 |

### Threshold 적절성
| 메트릭 | 현재 설정 | 권장값 | 판단 |

### 누락된 시나리오
| 시나리오 | 중요도 | 이유 |
```
