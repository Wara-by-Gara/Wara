import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfileEditScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '프로필 수정' }} />
      <ThemedText type="title">프로필 수정</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
