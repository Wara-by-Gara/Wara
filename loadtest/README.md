# Load Testing (k6)

## 목적

부하테스트를 통해 누락된 DB 인덱스 병목을 발견하고, 인덱스 추가 전후의 응답 시간을 측정한다.

## 타겟 엔드포인트

| # | 라우트 | 측정 포인트 |
|---|---|---|
| 01 | `GET /invitations` | `invitations.user_id` 인덱스 부재 |
| 02 | `GET /invitations/:id/participants` | `participants.invitation_id` 단독 인덱스 부재 |
| 03 | `GET /invitations/:id` | baseline (PK lookup + 조인) |

## 사전 준비

1. dev DB에 시드 데이터 (`pnpm -F api db:seed` → 유저 1만, 초대장 5천, 참가자 3만+)
2. `apps/api/drizzle/seed/seed-tokens.json` 생성됨 (시드 시 자동)
3. API 서버 실행 (`pnpm -F api dev`)

## 실행

### k6 설치 (택1)

- **winget**: `winget install k6`
- **chocolatey**: `choco install k6`
- **docker** (설치 없이): 아래 docker 명령 참고

### 로컬 k6

```powershell
# loadtest/ 디렉토리에서 실행
k6 run 01-my-invitations.js
k6 run 02-participants-list.js
k6 run 03-invitation-detail.js
```

API 서버가 다른 포트면 `BASE_URL` 환경변수로 오버라이드:

```powershell
$env:BASE_URL = "http://localhost:3001"; k6 run 01-my-invitations.js
```

### Docker로 실행 (k6 미설치 시)

리포지토리 루트에서:

```powershell
docker run --rm -i --network host `
  -v "${PWD}\loadtest:/work" `
  -v "${PWD}\apps:/apps" `
  -w /work `
  grafana/k6 run -e BASE_URL=http://host.docker.internal:3000 01-my-invitations.js
```

> Windows Docker Desktop은 `host.docker.internal`로 호스트 접근 가능. Linux는 `--network host` + `http://localhost:3000`.

## 결과 저장

```powershell
k6 run --summary-export=results/01-before.json 01-my-invitations.js
```

baseline 측정 후 인덱스 추가, 그 후 동일 명령에 `01-after.json`으로 재측정해서 비교.
