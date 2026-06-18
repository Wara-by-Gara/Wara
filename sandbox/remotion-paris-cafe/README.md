# Remotion sandbox — Paris Autumn Café template

개인 sandbox입니다. turbo/pnpm workspace에 포함되지 않습니다.

## 디자인 참고

- 스크랩북 종이 + 파리 카페 테라스 배경
- 가을 낙엽 날림 (Remotion preview)
- WARA 앱 연동: **PNG still export** + **`leaf` CSS animation**

## 트러블슈팅 (왜 느리거나 멈춘 것처럼 보였나)

| 단계 | 원인 |
|------|------|
| `npm run still` (Remotion) | Windows에서 Chrome Headless Shell **113MB 다운로드** 후 **브라우저 연결 25초 타임아웃** |
| Unsplash 배경 URL | 404 HTML만 받아짐 → `assets/design-reference.png` 로 대체 |
| `npm install` + sharp | 네이티브 바이너리 설치로 **수 분** 소요 (정상) |
| `db:seed:essential` | **Docker Desktop 미실행** 시 Postgres 연결 실패 |

**v1 권장:** `npm run export:png` (sharp, ~20초) — Remotion still 대신 사용.

## 사용법

```bash
cd sandbox/remotion-paris-cafe
npm install
npm run studio          # Remotion Studio (모션 초안)
npm run export:png      # PNG → out/ + apps/web/public/template_images/ (권장 v1)
# npm run still         # Remotion still (Chrome 필요, Windows에서 타임아웃 가능)
```

## WARA 연동

1. `npm run export:png` 실행 (또는 Remotion still 성공 시 `out/preview.png` 수동 복사)
2. 시드 반영:

   ```bash
   pnpm --filter @wara/api db:seed:essential
   ```

## 앱에서의 매핑

| 필드 | 값 |
|------|-----|
| `bgColor` | `bg-invite-film` (따뜻한 크래프트 톤) |
| `animation` | `leaf` (🍂🍁 낙엽) |
| `theme` | `cafe` |
