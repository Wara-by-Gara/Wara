import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AccountSettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '계정 설정' }} />
      <ThemedText type="title">계정 설정</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
