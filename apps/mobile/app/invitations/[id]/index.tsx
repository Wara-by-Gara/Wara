/**
 * 초대장 상세 화면 (Phase 1) — 커버 + 정보 섹션 + 내 RSVP.
 * iOS 네이티브 룩: grouped 리스트 · 시스템 시맨틱 컬러 · SF Symbols.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { WaraApiError } from '@/api';
import { ListRow, ListSection, Screen } from '@/components/ios';
import { InvitationCover } from '@/components/invitation/InvitationCover';
import { RsvpControl } from '@/components/invitation/RsvpControl';
import { useInvitation } from '@/hooks/queries/invitations';
import { ios, iosMetrics, iosType } from '@/theme';

export default function InvitationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isPending, error } = useInvitation(id);

  if (isPending) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '초대장' }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !data) {
    const message =
      error instanceof WaraApiError
        ? `${error.code} — 초대장을 불러오지 못했어요`
        : '네트워크 오류 — 잠시 후 다시 시도해 주세요';
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '오류' }} />
        <Text style={styles.errorTitle}>불러오기 실패</Text>
        <Text style={styles.errorBody}>{message}</Text>
      </View>
    );
  }

  const inv = data;
  const hostName = inv.host?.nickname ?? inv.host?.name ?? null;
  const location = inv.eventLocation;

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: inv.title }} />
      <View style={styles.body}>
        <InvitationCover invitation={inv} />

        <View style={styles.headerBlock}>
          <Text style={styles.title}>{inv.title}</Text>
          {hostName ? <Text style={styles.host}>{hostName}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="참가자 보기"
            onPress={() => router.push(`/invitations/${id}/participants`)}
            style={({ pressed }) => [styles.participantRow, pressed && styles.participantPressed]}>
            <Text style={styles.participantText}>참가자 {inv.participantTotal ?? 0}명</Text>
          </Pressable>
        </View>

        <ListSection style={styles.section}>
          {inv.eventStartAt ? (
            <ListRow title="일시" value={formatKstDateTime(inv.eventStartAt)} accessory="none" />
          ) : null}
          {location ? (
            <ListRow
              title={location.placeName || '장소'}
              subtitle={location.address}
              accessory="chevron"
              onPress={() => router.push(`/invitations/${id}/map`)}
            />
          ) : null}
          {inv.fee ? <ListRow title="회비" value={inv.fee} accessory="none" /> : null}
          {inv.dressCode ? <ListRow title="드레스코드" value={inv.dressCode} accessory="none" /> : null}
          {inv.parkingInfo ? <ListRow title="주차" value={inv.parkingInfo} accessory="none" /> : null}
        </ListSection>

        {inv.description ? (
          <View style={styles.section}>
            <Text style={styles.description}>{inv.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <RsvpControl invitation={inv} />
        </View>
      </View>
    </Screen>
  );
}

const WEEKDAY_KO: Record<string, string> = {
  Sun: '일',
  Mon: '월',
  Tue: '화',
  Wed: '수',
  Thu: '목',
  Fri: '금',
  Sat: '토',
};

/** ISO → KST '7월 2일 (수) 오후 7:00'. */
function formatKstDateTime(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const period = get('dayPeriod').toLowerCase() === 'am' ? '오전' : '오후';
  const weekday = WEEKDAY_KO[get('weekday')] ?? get('weekday');

  return `${month}월 ${day}일 (${weekday}) ${period} ${hour}:${minute}`;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemBackground,
  },
  body: { paddingHorizontal: iosMetrics.pagePadding, paddingBottom: iosMetrics.spacing[10] },
  headerBlock: { marginTop: iosMetrics.spacing[5], gap: iosMetrics.spacing[1] },
  title: { ...iosType.title1, fontWeight: '700', color: ios.label },
  host: { ...iosType.subhead, color: ios.secondaryLabel },
  participantRow: { marginTop: iosMetrics.spacing[1], alignSelf: 'flex-start' },
  participantPressed: { opacity: 0.5 },
  participantText: { ...iosType.subhead, color: ios.tint },
  section: { marginTop: iosMetrics.spacing[6] },
  description: { ...iosType.body, color: ios.label },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.footnote, color: ios.secondaryLabel, textAlign: 'center' },
});
