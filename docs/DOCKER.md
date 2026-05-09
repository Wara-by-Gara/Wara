# Wara Docker 가이드

팀원들을 위한 Docker 개념 설명 및 프로젝트 사용법 정리.

---

## 1. Docker란?

> "내 컴퓨터에서는 됐는데..." 를 없애주는 도구

Docker는 애플리케이션과 그 실행 환경을 **컨테이너**라는 단위로 묶어서, 어떤 컴퓨터에서도 똑같이 실행되도록 해주는 도구다.

이 프로젝트에서는 **PostgreSQL 데이터베이스**를 Docker로 실행한다.
→ 팀원 모두가 따로 PostgreSQL을 설치하지 않아도 동일한 DB 환경에서 개발할 수 있다.

---

## 2. 핵심 개념

### Image (이미지)
앱을 실행하는 데 필요한 모든 것이 담긴 **설계도**. 변경 불가능한 스냅샷.

```
postgres:16-alpine  →  PostgreSQL 16 버전이 담긴 이미지 (Docker Hub에서 다운로드)
```

### Container (컨테이너)
이미지를 **실제로 실행한 인스턴스**. 이미지 하나로 컨테이너를 여러 개 만들 수 있다.

```
이미지 (붕어빵 틀)  →  컨테이너 (붕어빵)
```

### Dockerfile
이미지를 만드는 **명령어 스크립트**. "이 이미지를 어떻게 만들어라"를 정의한다.

```dockerfile
FROM node:20-alpine   # 베이스 이미지
COPY . .              # 파일 복사
RUN pnpm build        # 빌드 실행
CMD ["node", "main"]  # 실행 명령
```

### docker-compose
**여러 컨테이너를 한 번에 관리**하는 도구. `docker-compose.yml` 파일 하나로 여러 서비스를 정의하고 실행한다.

```
docker compose up -d  →  정의된 모든 컨테이너 한 번에 실행
```

### Volume (볼륨)
컨테이너는 꺼지면 내부 데이터가 사라진다. Volume은 **컨테이너 외부에 데이터를 저장**해서 컨테이너가 꺼져도 데이터가 유지되도록 한다.

```
postgres_data 볼륨  →  컨테이너가 꺼져도 DB 데이터 유지
```

### Port Mapping (포트 매핑)
컨테이너는 격리된 환경이라 외부에서 바로 접근할 수 없다. **호스트 포트와 컨테이너 포트를 연결**해서 접근 가능하게 만든다.

```
"5432:5432"  →  내 맥의 5432 포트 ↔ 컨테이너의 5432 포트 연결
```

### Multi-stage Build
Dockerfile에서 **빌드 환경과 실행 환경을 분리**하는 기법. TypeScript 컴파일러 등 빌드에만 필요한 도구는 최종 이미지에서 제외해 이미지 크기를 줄인다.

```dockerfile
FROM node AS builder   # 1단계: 빌드 (무거움)
RUN pnpm build

FROM node AS runner    # 2단계: 실행 (가벼움)
COPY --from=builder /app/dist ./dist  # 결과물만 복사
```

---

## 3. 프로젝트 Docker 구조

```
Wara/
├── docker-compose.yml       # 개발용 PostgreSQL 컨테이너 설정
├── .env                     # 실제 환경변수 (git에 올리지 않음)
├── .env.example             # 환경변수 템플릿 (git에 올라감)
├── .dockerignore            # Docker 빌드 시 제외할 파일 목록
└── apps/
    ├── api/
    │   └── Dockerfile       # NestJS API 프로덕션 이미지 빌드용
    └── web/
        └── Dockerfile       # Next.js 웹 프로덕션 이미지 빌드용
```

### docker-compose.yml
개발 시 PostgreSQL을 실행하는 설정.

```yaml
services:
  postgres:
    image: postgres:16-alpine          # Docker Hub에서 이미지 가져옴
    container_name: wara_postgres      # 컨테이너 이름
    ports:
      - "5432:5432"                    # 로컬 5432 포트로 접근 가능
    environment:
      POSTGRES_USER: ${POSTGRES_USER}  # .env 파일에서 읽어옴
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data  # 데이터 영구 보존
```

### apps/api/Dockerfile, apps/web/Dockerfile
**개발할 때는 사용하지 않는다.** CI/CD(자동 빌드/배포) 또는 프로덕션 서버 배포 시 사용.

---

## 4. 처음 시작하는 팀원용 세팅

### Step 1. Docker Desktop 설치
[docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) 에서 다운로드 후 설치. 설치 후 Docker Desktop 앱을 실행해둔다.

### Step 2. 환경변수 파일 설정
프로젝트 루트에서 `.env.example`을 복사해 `.env`를 만들고 값을 채운다.

```bash
cp .env.example .env
```

`.env` 파일을 열어 값 입력:

```env
POSTGRES_USER=원하는유저명
POSTGRES_PASSWORD=원하는비밀번호
POSTGRES_DB=원하는DB이름
```

그리고 `apps/api/.env.development`의 `DATABASE_URL`도 동일한 값으로 맞춰준다:

```env
DATABASE_URL=postgresql://원하는유저명:원하는비밀번호@localhost:5432/원하는DB이름
```

### Step 3. PostgreSQL 컨테이너 실행

```bash
docker compose up -d
```

### Step 4. DB 마이그레이션 실행

```bash
cd apps/api
pnpm db:migrate
```

### Step 5. 개발 시작

```bash
# 프로젝트 루트에서
pnpm dev
```

---

## 5. 자주 쓰는 명령어

### 컨테이너 시작 / 중지

```bash
# 백그라운드로 실행 (-d: detach, 터미널을 점유하지 않음)
docker compose up -d

# 컨테이너 중지 (데이터는 유지됨)
docker compose down

# 컨테이너 재시작
docker compose restart
```

### 상태 확인

```bash
# 실행 중인 컨테이너 목록과 상태 확인
docker compose ps

# 환경변수가 올바르게 치환됐는지 미리 확인
docker compose config
```

### 로그 확인

```bash
# postgres 컨테이너 로그 보기
docker compose logs postgres

# 실시간으로 로그 계속 보기 (-f: follow)
docker compose logs -f postgres
```

### 컨테이너 내부 접속

```bash
# postgres 컨테이너 안으로 직접 들어가기
docker compose exec postgres sh

# psql로 DB에 직접 접속
docker compose exec postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
```

### 데이터 초기화

```bash
# 컨테이너 중지 + 볼륨(DB 데이터)까지 삭제
# 주의: DB 데이터가 전부 지워짐
docker compose down -v
```

### 이미지/컨테이너 정리

```bash
# 사용하지 않는 컨테이너, 이미지, 볼륨 전체 정리
docker system prune
```

---

## 6. 주의사항

### .env 파일은 절대 git에 올리지 않는다
`.env`는 비밀번호 등 민감한 정보가 담겨 있어서 이미 `.gitignore`에 등록되어 있다. `git add .` 해도 자동으로 제외되지만, 실수로 올리지 않도록 주의한다.

```
.env          ← git 추적 안 됨 (실제 비밀값)
.env.example  ← git 추적 됨  (빈 템플릿)
```

### `docker compose down -v`는 신중하게
`-v` 옵션을 붙이면 **볼륨(DB 데이터)까지 전부 삭제**된다. 로컬 개발 데이터가 모두 사라지므로 주의한다.

```bash
docker compose down      # 컨테이너만 중지, 데이터 유지
docker compose down -v   # 컨테이너 + 데이터 전부 삭제 (주의!)
```

### apps/api/Dockerfile, apps/web/Dockerfile은 개발용이 아님
이 파일들은 **프로덕션 배포용**이다. 로컬 개발 시에는 `pnpm dev`로 직접 실행하는 것이 핫 리로드도 빠르고 디버깅도 편하다.
