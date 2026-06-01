import { Stack } from 'expo-router';

export default function InvitationLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerBackTitle: '뒤로' }} />
      <Stack.Screen name="map" options={{ title: '지도', headerBackTitle: '뒤로' }} />
    </Stack>
  );
}
