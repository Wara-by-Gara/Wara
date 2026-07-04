// 고객센터 중첩 스택 — 허브 + FAQ + 문의.
// (루트에서 이 그룹을 등록/헤더 숨김하는 처리는 상위 레이아웃이 담당.)

import { Stack } from 'expo-router';

export default function SupportLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      <Stack.Screen name="index" options={{ title: '고객센터', headerLargeTitle: true }} />
      <Stack.Screen name="faq" options={{ title: '자주 묻는 질문', headerLargeTitle: true }} />
      <Stack.Screen name="inquiries/index" options={{ title: '내 문의', headerLargeTitle: true }} />
      <Stack.Screen name="inquiries/write" options={{ title: '문의하기' }} />
      <Stack.Screen name="inquiries/[id]" options={{ title: '문의 상세' }} />
    </Stack>
  );
}
