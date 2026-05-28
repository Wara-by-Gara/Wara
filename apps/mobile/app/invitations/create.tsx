import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function InvitationCreateScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '초대장 만들기' }} />
      <ThemedText type="title">초대장 만들기</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
