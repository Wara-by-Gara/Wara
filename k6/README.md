# K6 부하 테스트

WARA API의 성능 및 동시성을 검증하는 K6 부하 테스트 스크립트 모음.

## 설치

```bash
brew install k6
```

## 디렉토리 구조

```
k6/
├── helpers/
│   └── auth.js              # JWT 토큰 헬퍼 (환경변수 주입)
├── scenarios/
│   ├── invitation.js        # 초대장 조회 — 동시 100명
│   ├── rsvp.js              # RSVP 동시성 — 동시 50명
│   └── photos.js            # 사진 업로드 요청 — 동시 20명
├── load-test.js             # 전체 부하 시나리오 (점진적 증가)
└── README.md
```

## 환경변수

| 변수 | 필수 | 설명 | 예시 |
|------|:----:|------|------|
| `BASE_URL` | 아니오 | API 서버 주소 (기본값: `http://localhost:3001`) — `api/v1` prefix가 적용된 서버라면 `http://localhost:3001/api/v1` 로 설정 | `http://localhost:3001` |
| `INVITATION_ID` | 예 | 테스트에 사용할 초대장 ULID | `01JV...` |
| `ACCESS_TOKEN` | 예 | 단일 사용자 JWT Access Token | `eyJhbGci...` |
| `TOKENS` | 조건부 | 다중 사용자 시나리오용 JWT 배열 (JSON) | `["tok1","tok2"]` |
| `REFRESH_TOKEN` | 아니오 | 토큰 갱신이 필요한 경우 | `eyJhbGci...` |

### 토큰 발급 방법

K6 테스트 전 유효한 JWT를 미리 발급해 두어야 한다.
WARA는 소셜 로그인(카카오/네이버/애플)을 사용하므로, 브라우저에서 로그인 후 발급된 토큰을 사용한다.

```bash
# 브라우저 개발자 도구에서 토큰을 복사하거나
# 카카오 로그인 후 응답에서 accessToken을 추출한다
export ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
export INVITATION_ID=01JV...
```

다중 사용자 시나리오(rsvp.js)의 경우 서로 다른 계정의 토큰이 필요하다:

```bash
export TOKENS='["token_user1","token_user2","token_user3"]'
```

## 실행

### 전체 부하 테스트 (점진적 증가)

실제 서비스 트래픽 패턴을 모사한다. 10 VU에서 시작해 100 VU까지 점진적으로 증가.

```bash
k6 run \
  -e BASE_URL=http://localhost:3001 \
  -e INVITATION_ID=01JV... \
  -e ACCESS_TOKEN=your_jwt_token \
  k6/load-test.js
```

### 초대장 조회 시나리오 (동시 100명)

공유된 초대장 링크에 동시 접근하는 트래픽을 모사한다.

```bash
k6 run \
  -e BASE_URL=http://localhost:3001 \
  -e INVITATION_ID=01JV... \
  -e ACCESS_TOKEN=your_jwt_token \
  k6/scenarios/invitation.js
```

### RSVP 동시성 테스트 (동시 50명)

50명이 동시에 같은 초대장에 참가하고 RSVP를 변경한다.
동시성 충돌(409, 레이스 컨디션)을 검증한다.

```bash
k6 run \
  -e BASE_URL=http://localhost:3001 \
  -e INVITATION_ID=01JV... \
  -e TOKENS='["tok1","tok2","tok3"]' \
  k6/scenarios/rsvp.js
```

### 사진 업로드 요청 시나리오 (동시 20명)

presigned URL 발급 → DB 저장 흐름을 부하 테스트한다.
실제 S3 업로드는 K6에서 수행하지 않는다.

```bash
k6 run \
  -e BASE_URL=http://localhost:3001 \
  -e INVITATION_ID=01JV... \
  -e ACCESS_TOKEN=your_jwt_token \
  k6/scenarios/photos.js
```

## 성능 임계치 (Thresholds)

| 메트릭 | 기준 | 의미 |
|--------|------|------|
| `http_req_duration` p(95) | < 500ms | 전체 요청의 95%가 500ms 이내 응답 |
| `http_req_failed` | < 1% | HTTP 에러율 1% 미만 |
| `invitation_detail_duration` p(95) | < 200ms | 초대장 상세 조회 (Public, 캐시 가능) |
| `participant_list_duration` p(95) | < 500ms | 참가자 목록 조회 (DB 조회 포함) |
| `presigned_url_duration` p(95) | < 300ms | presigned URL 발급 (S3 서명만) |
| `rsvp_join_duration` p(95) | < 500ms | 초대장 참가 (DB write) |
| `rsvp_change_duration` p(95) | < 500ms | RSVP 변경 (DB update) |

## 결과 출력 예시

```
✓ invitation detail: status 200
✓ invitation detail: has data
✓ participants list: status 200

checks.........................: 99.85% ✓ 11982  ✗ 18
data_received..................: 45 MB  375 kB/s
data_sent......................: 3.2 MB 26 kB/s
http_req_duration..............: avg=87ms   min=12ms med=65ms   max=1.2s   p(90)=180ms p(95)=240ms
http_req_failed................: 0.00%  ✓ 0      ✗ 12000
invitation_detail_duration.....: avg=45ms   min=8ms  med=38ms   max=320ms  p(90)=95ms  p(95)=140ms
```

## Grafana 연동 (선택)

K6 결과를 실시간으로 시각화하려면:

```bash
# InfluxDB + Grafana
k6 run --out influxdb=http://localhost:8086/k6 k6/load-test.js

# Prometheus Remote Write
k6 run --out experimental-prometheus-rw k6/load-test.js
```
