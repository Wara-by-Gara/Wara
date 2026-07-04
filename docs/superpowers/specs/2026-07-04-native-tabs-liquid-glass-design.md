# 모바일 탭바 iOS 26 Liquid Glass 전환 설계

- 날짜: 2026-07-04
- 대상: `apps/mobile/app/(tabs)/_layout.tsx`
- 참조 디자인: Figma "iOS and iPadOS 26 (Community)" Tab Bar 컴포넌트 (node 3-72207) — iOS 26 표준 Liquid Glass 탭바

## 목표

클래식 JS 탭바(expo-router `Tabs`)를 iOS 26 네이티브 Liquid Glass 탭바로 교체한다.
시스템이 유리 재질·블러·스크롤 시 투명도를 자동 처리하는 네이티브 컴포넌트를 사용한다.

## 구현 방식

Expo SDK 54 expo-router의 NativeTabs 사용 (승인된 접근법).

```tsx
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
```

### 변경 내용

1. `Tabs` → `NativeTabs` 교체. `useAuthGuard` / `useTermsGuard` 게이트 구조는 유지.
2. 5개 `Tabs.Screen` → `NativeTabs.Trigger` 1:1 변환. 아이콘·라벨 유지:

   | name | SF Symbol | Label |
   |------|-----------|-------|
   | index | `house.fill` | 홈 |
   | invitations | `envelope.fill` | 초대장 |
   | photos | `photo.on.rectangle.angled` | 사진 |
   | notifications | `bell.fill` | 알림 |
   | profile | `person.fill` | 마이 |

3. 선택 틴트: `tintColor={ios.tint}` (systemBlue — 앱 크롬 토큰 규칙 준수).

### 제거

- `HapticTab`(tabBarButton) — 네이티브 탭바는 커스텀 버튼 주입 불가, 시스템이 인터랙션 처리
- `IconSymbol` 의존 — `Icon sf=` prop이 SF Symbol 직접 수용
- `headerShown: false` — NativeTabs는 헤더를 렌더하지 않음

## 영향 범위

- 탭바 시각/동작만 변경. 라우팅 구조·화면 코드·가드 로직 무변경.
- 다른 파일 수정 없음.

## 리스크

1. `unstable-native-tabs` 네임스페이스 — SDK 55에서 import 경로 변경 가능성. 단일 파일이라 마이그레이션 비용 낮음.
2. dev client 바이너리에 네이티브 탭 컴포넌트 포함 여부 — SDK 54 소스로 금일 빌드했으므로 포함 예상. 런타임 확인으로 검증.

## 검증

- `pnpm lint && pnpm typecheck` 통과
- iOS 26.5 시뮬레이터에서 Liquid Glass 탭바 렌더링 확인 (스크린샷)
- 5개 탭 전환 동작 확인
