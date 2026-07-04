// 리마인드 수신 설정 — 모임 리마인드 알림 on/off(알림설정 isRemind).
// 발송 시점(모임 전날/후 7·30일)은 서버가 자동 발송하며 현재 개별 on/off는 미지원 → 읽기전용 안내.

import { Stack } from 'expo-router';
import { Alert, StyleSheet, Text } from 'react-native';

import { WaraApiError } from '@/api';
import { ListRow, ListSection, Screen } from '@/components/ios';
import { useReminderSettings, useUpdateReminderSettings } from '@/hooks/queries/reminders';
import { ios, iosMetrics, iosType } from '@/theme';

// 서버 remind_logs 발송 시점(remindTypeEnum)과 사람이 읽는 라벨. 자동 발송이라 조정 불가.
const REMIND_TIMINGS: { key: string; title: string; value: string }[] = [
  { key: 'D-1', title: '모임 전날', value: '자동' },
  { key: 'D+7', title: '모임 후 7일', value: '자동' },
  { key: 'D+30', title: '모임 후 30일', value: '자동' },
];

export default function RemindersScreen() {
  const { data, isPending, isError } = useReminderSettings();
  const updateSettings = useUpdateReminderSettings();

  // 설정 행이 아직 없으면(null) 서버 기본값과 동일하게 수신 on으로 취급.
  const isRemind = data?.isRemind ?? true;

  const handleToggle = (next: boolean) => {
    updateSettings.mutate(
      { isRemind: next },
      {
        onError: (err) => {
          const message =
            err instanceof WaraApiError
              ? `설정을 변경하지 못했어요 (${err.code})`
              : '네트워크 오류로 설정을 변경하지 못했어요';
          Alert.alert('리마인드 설정', message);
        },
      },
    );
  };

  if (isPending) {
    return (
      <Screen background="grouped">
        <Stack.Screen options={{ title: '리마인드' }} />
        <Text style={styles.centerNote}>불러오는 중…</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen background="grouped">
        <Stack.Screen options={{ title: '리마인드' }} />
        <Text style={styles.centerNote}>리마인드 설정을 불러오지 못했어요.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll background="grouped">
      <Stack.Screen options={{ title: '리마인드' }} />

      <ListSection
        header="리마인드 알림"
        footer="모임 리마인드 알림을 받을지 설정해요. 끄면 아래 모든 리마인드가 발송되지 않아요.">
        <ListRow
          title="리마인드 수신"
          icon="bell.badge.fill"
          switchValue={isRemind}
          onSwitchChange={handleToggle}
        />
      </ListSection>

      <ListSection
        header="발송 시점"
        footer="발송 시점은 모임 일정에 맞춰 자동으로 정해져요. 시점별 개별 설정은 준비 중이에요.">
        {REMIND_TIMINGS.map((t) => (
          <ListRow
            key={t.key}
            title={t.title}
            value={isRemind ? t.value : '꺼짐'}
            accessory="none"
          />
        ))}
      </ListSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerNote: {
    ...iosType.body,
    color: ios.secondaryLabel,
    textAlign: 'center',
    marginTop: iosMetrics.spacing[12],
  },
});
