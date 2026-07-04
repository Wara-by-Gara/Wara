/**
 * 초대장 생성 다단계 스택 — 각 스텝을 iOS 네이티브 헤더가 있는 화면으로 등록.
 * (루트에서 이 그룹을 modal로 present하는 등록은 상위 레이아웃이 처리.)
 */

import { Stack } from 'expo-router';

export default function CreateInvitationLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      <Stack.Screen name="index" options={{ title: '템플릿' }} />
      <Stack.Screen name="basics" options={{ title: '기본 정보' }} />
      <Stack.Screen name="design" options={{ title: '디자인' }} />
      <Stack.Screen name="ai-cover" options={{ title: 'AI 커버' }} />
      <Stack.Screen name="rsvp" options={{ title: 'RSVP' }} />
      <Stack.Screen name="share" options={{ title: '완성' }} />
    </Stack>
  );
}
