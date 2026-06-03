import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DevTokenForm } from '@/components/dev-token-form';

// dev 전용 — 시드 유저로 빠른 진입. login.tsx에서 __DEV__일 때만 연결됨.
export default function DevLoginScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <DevTokenForm onIssued={() => router.replace('/(tabs)')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
