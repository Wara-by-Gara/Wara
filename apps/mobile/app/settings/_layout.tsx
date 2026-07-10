// 설정 중첩 스택 — 설정 허브 + 약관 뷰어.
// (루트에서 이 그룹을 등록/헤더 숨김하는 처리는 상위 레이아웃이 담당.)

import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      <Stack.Screen name="index" options={{ title: '설정', headerLargeTitle: true }} />
      <Stack.Screen name="terms/index" options={{ title: '약관 및 정책', headerLargeTitle: true }} />
      <Stack.Screen name="terms/[type]" options={{ title: '약관' }} />
      <Stack.Screen name="reminders" options={{ title: '리마인드', headerLargeTitle: true }} />
    </Stack>
  );
}
