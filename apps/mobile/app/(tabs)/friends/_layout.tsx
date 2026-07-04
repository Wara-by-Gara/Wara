// 친구 중첩 스택 — 목록(index)·프로필([userId])·삭제한 친구(hidden).
import { Stack } from 'expo-router';

export default function FriendsLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      <Stack.Screen name="index" options={{ title: '친구', headerLargeTitle: true }} />
      <Stack.Screen name="[userId]" options={{ title: '' }} />
      <Stack.Screen name="hidden" options={{ title: '삭제한 친구', headerLargeTitle: true }} />
    </Stack>
  );
}
