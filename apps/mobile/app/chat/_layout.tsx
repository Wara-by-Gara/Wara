// DM 중첩 스택 — 대화 목록(index) / 채팅방([conversationId]).
// 헤더는 루트 Stack의 iOS 네이티브(large title + blur)를 상속한다.

import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      <Stack.Screen name="index" options={{ title: '메시지', headerLargeTitle: true }} />
      <Stack.Screen name="[conversationId]" options={{ title: '', headerLargeTitle: false }} />
    </Stack>
  );
}
