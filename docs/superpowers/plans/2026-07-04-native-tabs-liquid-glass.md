# 모바일 탭바 iOS 26 Liquid Glass (NativeTabs) 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** expo-router 클래식 `Tabs` 탭바를 iOS 26 네이티브 Liquid Glass 탭바(`NativeTabs`)로 교체한다.

**Architecture:** `apps/mobile/app/(tabs)/_layout.tsx` 단일 파일에서 `Tabs`를 `expo-router/unstable-native-tabs`의 `NativeTabs`로 교체한다. 인증/약관 가드 구조는 유지하고, 5개 탭의 SF Symbol 아이콘과 한글 라벨을 1:1로 옮긴다. 유리 재질·블러·스크롤 투명도는 iOS 26 시스템이 처리한다.

**Tech Stack:** Expo SDK 54, expo-router `unstable-native-tabs` (NativeTabs / Icon / Label), React Native `PlatformColor`

## Global Constraints

- Expo SDK 54 잠금 (`~` 마이너 잠금, 임의 업그레이드 금지) — CLAUDE.md
- 앱 크롬 색상은 `theme/`의 PlatformColor 시맨틱 토큰만 사용 (hex 금지) — `ios.tint` = `PlatformColor('systemBlue')`
- iOS 전용 앱 (`platforms: ["ios"]`) — Android 분기 금지
- `any` 타입 금지, `console.log` 커밋 금지
- 모바일 워크스페이스에는 단위 테스트 인프라가 없음 — 검증은 `lint` + `typecheck` + 시뮬레이터 런타임 확인으로 대체 (스펙의 검증 섹션 기준)

---

### Task 1: (tabs)/_layout.tsx를 NativeTabs로 전환

**Files:**
- Modify: `apps/mobile/app/(tabs)/_layout.tsx` (전체 63줄 교체)

**Interfaces:**
- Consumes: `expo-router/unstable-native-tabs`의 `NativeTabs`, `Icon`, `Label` / `@/theme`의 `ios.tint` / 기존 훅 `useAuthGuard`, `useTermsGuard`
- Produces: 없음 (리프 레이아웃 파일 — 다른 코드가 import하지 않음)

- [ ] **Step 1: _layout.tsx 전체를 NativeTabs 구현으로 교체**

`apps/mobile/app/(tabs)/_layout.tsx` 전체 내용을 아래로 교체:

```tsx
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

import { ios } from '@/theme';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useTermsGuard } from '@/hooks/useTermsGuard';

export default function TabLayout() {
  const { isReady } = useAuthGuard();
  if (!isReady) return null;
  return <AuthenticatedTabs />;
}

function AuthenticatedTabs() {
  useTermsGuard();

  return (
    <NativeTabs tintColor={ios.tint}>
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" />
        <Label>홈</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="invitations">
        <Icon sf="envelope.fill" />
        <Label>초대장</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="photos">
        <Icon sf="photo.on.rectangle.angled" />
        <Label>사진</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications">
        <Icon sf="bell.fill" />
        <Label>알림</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
        <Label>마이</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

제거되는 것: `HapticTab`(네이티브 탭바는 커스텀 버튼 주입 불가), `IconSymbol`(`Icon sf=`가 SF Symbol 직접 수용), `headerShown: false`(NativeTabs는 헤더 미렌더), `tabBarActiveTintColor`/`tabBarInactiveTintColor`(`tintColor`로 대체, 비선택 색은 시스템 기본).

- [ ] **Step 2: lint / typecheck 통과 확인**

Run: `cd /Users/esther/Developer/Wara/apps/mobile && pnpm lint && pnpm typecheck`
Expected: 에러 0 (기존 warning 2건은 무관 — `chat/[conversationId].tsx`, `invitations/[id]/photos/index.tsx`의 exhaustive-deps)

주의: `tintColor={ios.tint}`에서 `ColorValue` 타입 불일치 에러가 나면 NativeTabs SDK 54 타입이 string만 받는 경우다. 그 경우 `tintColor` prop을 제거하고 시스템 기본 틴트로 둔다 (Liquid Glass는 배경 밝기에 따라 자동 적응하므로 허용 — 스펙 리스크 섹션 참고). hex 직접 입력으로 우회하지 않는다.

- [ ] **Step 3: 시뮬레이터 런타임 검증**

Metro가 `localhost:8081`에서 실행 중이고 iPhone 17 Pro(iOS 26.5) 시뮬레이터에 dev client가 설치된 상태를 전제로:

```bash
xcrun simctl terminate booted com.wara.app 2>/dev/null; sleep 1
xcrun simctl openurl booted "exp+wara://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
sleep 15
xcrun simctl io booted screenshot /tmp/nativetabs-check.png
```

스크린샷에서 확인할 것:
1. 하단에 플로팅 캡슐 형태의 Liquid Glass 탭바 렌더링 (기존 풀폭 클래식 바가 아님)
2. 탭 5개 (홈/초대장/사진/알림/마이) 아이콘+라벨 표시
3. 레드박스/에러 토스트 없음

Expected: iOS 26 Liquid Glass 탭바가 보임. 만약 "NativeTabs is not supported" 류의 네이티브 모듈 에러가 나면 dev client 재빌드 필요 → `cd apps/mobile/ios && xcodebuild -workspace wara.xcworkspace -scheme wara -configuration Debug -destination 'platform=iOS Simulator,id=FB398087-A05B-412C-AC21-7790BD928A77' -derivedDataPath build build` 후 `xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/wara.app` 재설치.

- [ ] **Step 4: 커밋**

```bash
cd /Users/esther/Developer/Wara
git add apps/mobile/app/\(tabs\)/_layout.tsx
git commit -m "feat(mobile): 탭바를 iOS 26 Liquid Glass NativeTabs로 전환"
```
