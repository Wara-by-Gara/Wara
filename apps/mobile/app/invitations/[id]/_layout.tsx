import { Stack } from 'expo-router';

export default function InvitationLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      <Stack.Screen name="index" options={{ headerTransparent: true, headerLargeTitle: false, title: '' }} />
      <Stack.Screen name="edit" options={{ title: '초대장 편집' }} />
      <Stack.Screen name="map" options={{ title: '지도' }} />
      <Stack.Screen name="participants" options={{ title: '참가자', headerLargeTitle: true }} />
      <Stack.Screen name="vote" options={{ title: '날짜 투표', headerLargeTitle: true }} />
      <Stack.Screen name="comments" options={{ title: '댓글' }} />
      <Stack.Screen name="photos/index" options={{ title: '앨범', headerLargeTitle: true }} />
      <Stack.Screen name="remeet" options={{ title: '재모임 만들기', headerLargeTitle: true }} />
      <Stack.Screen name="respond" options={{ title: '응답하기' }} />
    </Stack>
  );
}
