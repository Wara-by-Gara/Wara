import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import MapContainer from '@/components/MapContainer';

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '지도' }} />
      <MapContainer invitationId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
