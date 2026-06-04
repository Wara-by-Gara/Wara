# 모바일 개발 워크플로우 (Android 에뮬레이터)

> 새 브랜치에서 모바일 작업할 때 빠르게 보는 가이드.
> dev client APK가 에뮬레이터에 이미 설치된 상태를 전제.

---

## 평소 사이클 (JS만 바뀜)

1. **에뮬레이터 켜기** — Android Studio → Device Manager → AVD 옆 ▶
2. **API 서버 띄우기** (`Wara/` 루트, 별도 터미널)

   ```bash
   pnpm --filter @wara/api dev
   ```

3. **Metro 띄우기** (`apps/mobile/`)

   ```bash
   pnpm start -c
   ```

   `-c`는 캐시 클리어. env / app.config / metro.config가 바뀐 직후엔 붙이고, 일반 코드 변경만이면 생략 OK.

4. Metro 메뉴 뜨면 키보드 **`a`** → 에뮬레이터에 앱 자동 실행

### Metro 메뉴 키
- `a` — Android 열기
- `r` — 강제 reload
- `j` — JS debugger
- `m` — dev menu 토글 (에뮬레이터에서 `Ctrl+M`과 동일)

### 코드 변경 시
- JS / TSX 저장 → Fast Refresh 자동 적용 (수동 reload 불필요)
- 안 먹으면 `r` 두 번 빠르게

---

## DEV 로그인 (시드 유저)

> 실제 카카오 / 네이버 등 SDK를 통하지 않고 빠르게 인증된 상태로 진입.

1. 로그인 화면 하단 **"DEV 로그인 (시드 유저)"** 링크 클릭
2. 시드 유저 5개 중 선택:
   - `host001@wara.dev` ~ `host004@wara.dev` — 일반 멤버, 호스트 흐름 테스트용
   - `admin@wara.dev` — admin role, 어드민 화면 테스트용
3. 약관 자동 동의 후 홈 진입

내부 동작:
- `POST /auth/dev/token`이 시드 화이트리스트 검증 + 누락된 필수 약관 자동 동의 + access token 발급
- `NODE_ENV !== 'production'`일 때만 등록 — 프로덕션 빌드엔 자동 제외

### 시드 유저가 DB에 없을 때

```bash
pnpm --filter @wara/api db:seed
```

최초 1회만. 이미 시드돼 있으면 `onConflictDoNothing`.

---

## 새 native 의존성을 추가했을 때

⚠️ 다음 변경은 dev client APK **재빌드** 필요:
- `apps/mobile/package.json`에 새 native module (예: `react-native-svg`, `expo-notifications`)
- `app.config.ts`의 plugin 추가 / 변경 (Info.plist / AndroidManifest 영향)
- Expo SDK 메이저 업그레이드

### EAS rebuild + 설치

```bash
# 1. 빌드 트리거 (~30분 ~ 3시간, 클라우드)
cd apps/mobile
eas build --profile development --platform android

# 2. 빌드 완료 후 APK URL 확인
eas build:list --platform android --limit 1
# Application Archive URL 복사
```

```powershell
# 3-PowerShell. 에뮬레이터 켜진 상태에서 덮어쓰기 설치
$apk = "$env:TEMP\wara-dev.apk"
Invoke-WebRequest -Uri "<APK_URL>" -OutFile $apk
adb install -r $apk
```

```bash
# 3-Bash 대안
curl -L -o /tmp/wara-dev.apk "<APK_URL>"
adb install -r /tmp/wara-dev.apk
```

### JS만 바뀌면 EAS rebuild 불필요
- Metro reload만으로 즉시 반영
- 같은 APK 그대로 사용 가능

---

## 환경 설정 (한 번만)

### adb를 PATH에

Android Studio 설치 시 `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`에 있음.

PowerShell (User scope 영구 등록):

```powershell
[Environment]::SetEnvironmentVariable(
  "Path",
  $env:Path + ";$env:LOCALAPPDATA\Android\Sdk\platform-tools",
  "User"
)
```

새 터미널부터 적용.

### `apps/mobile/.env.development`

`EXPO_PUBLIC_API_URL`이 **`http://10.0.2.2:3001`** 인지 확인.

- Android 에뮬레이터에서 `localhost`는 에뮬레이터 자신을 가리킴 → 호스트 PC API에 못 닿음
- `10.0.2.2`는 에뮬레이터가 호스트 PC를 가리키는 특수 IP
- iOS 시뮬레이터에선 `localhost` 그대로 OK

### (선택) Windows Long Paths — 로컬 native 빌드용

`npx expo run:android`로 로컬에서 native 빌드할 때만 필요. EAS 빌드만 쓰면 불필요.

관리자 PowerShell:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

재부팅 필요. 그래도 pnpm 해시 디렉터리가 길어서 CMake/ninja가 막힐 수 있음 — 로컬 native 빌드는 추천하지 않음.

---

## 트러블슈팅

### `Cannot find native module 'XXX'`
APK가 그 모듈 없이 빌드된 상태. **EAS rebuild 필요**. (PR #156에서 ExpoLinking으로 같은 증상)

### "Network request failed" / API 호출 다 실패
1. API 서버 떠있는지: `curl http://localhost:3001/api/terms` → 200
2. `apps/mobile/.env.development`의 API_URL이 `10.0.2.2:3001`인지
3. Metro 캐시 클리어: `pnpm start -c`

### 약관 미동의로 모든 인증 API 403
`TERMS_AGREEMENT_REQUIRED`. DEV 로그인은 자동 동의해주지만, 실제 소셜 로그인으로 들어온 시드 유저는 약관 동의 흐름을 거쳐야 함.

### `<Text onPress>` 가 안 먹히는 듯할 때
nested Text의 onPress는 hit area가 좁아서 누르기 어려운 경우 있음. `Pressable + hitSlop`로 감싸기.

### dev client에 RedBox 떴을 때
- Metro 터미널의 빨간 로그가 RedBox보다 자세함
- 스크린샷이 더 빠를 때:
  ```bash
  adb exec-out screencap -p > screenshot.png
  ```

### 에뮬레이터 안 잡힐 때

```bash
adb devices
```

`List of devices attached` 한 줄만 나오면 에뮬레이터가 켜져 있지 않은 것. Android Studio Device Manager에서 ▶ 다시.

---

## 시드 데이터 요약

`pnpm --filter @wara/api db:seed` 결과:

| 도메인 | 양 |
|---|---|
| users | 202명 (host001~, guest001~, admin, blocked) |
| invitations | 100개 |
| participants | 746건 |
| photos | 1,483장 / 좋아요 2,377건 |
| feedbacks | 1,200건 |
| missions | 68건 / mission_assignments 68건 |
| notifications | 300건 |
| terms | 3개 (필수 활성 약관 포함) |

자세한 정의는 `apps/api/drizzle/seed/fixtures.ts` 참고.

---

## 관련 PR / 이슈

- PR #156 — 이 가이드의 워크플로우 + dev-auth 백엔드 + 모바일 안정성
- 후속 작업 이슈: #157 ~ #167
