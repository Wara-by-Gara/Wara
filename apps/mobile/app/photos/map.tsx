import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import PhotoMapContainer from '@/components/PhotoMapContainer';

export default function PhotoMapScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '사진 지도' }} />
      <PhotoMapContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
