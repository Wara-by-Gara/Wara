// 숨긴 초대장 목록 — 웹 /invitations/hidden 미러.
// 커버 썸네일·제목·일정·장소 행, 탭→상세, 스와이프 '되돌리기'로 숨김 해제.
// 앱 크롬이므로 색상/메트릭은 theme 토큰과 components/ios 킷만 사용.

import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { Button, ListSection, Screen, SwipeableRow } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError, type InvitationListItem } from '@/api';
import { useHiddenInvitations, useHideInvitation } from '@/hooks/queries/invitations';

const THUMB_SIZE = 56;

/** WaraApiError code → 한국어 안내. */
function messageForError(err: unknown): string {
  if (err instanceof WaraApiError && err.code === 'INVITATION_NOT_FOUND') {
    return '초대장을 찾을 수 없어요';
  }
  return '문제가 발생했어요';
}

/** ISO → "7월 1일 오후 07:00". */
function formatEventDate(iso: string | null): string {
  if (!iso) return '일정 미정';
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HiddenInvitationsScreen() {
  const hiddenQuery = useHiddenInvitations();
  const hideInvitation = useHideInvitation();

  if (hiddenQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (hiddenQuery.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(hiddenQuery.error)}</Text>
        <Button title="다시 시도" onPress={() => hiddenQuery.refetch()} />
      </View>
    );
  }

  const invitations = hiddenQuery.data ?? [];

  return (
    <Screen
      background="grouped"
      scroll
      refreshControl={
        <RefreshControl
          refreshing={hiddenQuery.isRefetching}
          onRefresh={() => hiddenQuery.refetch()}
        />
      }>
      {invitations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>숨긴 초대장이 없어요</Text>
          <Text style={styles.emptySub}>초대장을 숨기면 여기서 되돌릴 수 있어요</Text>
        </View>
      ) : (
        <ListSection footer="스와이프해서 초대장을 되돌릴 수 있어요.">
          {invitations.map((inv) => (
            <InvitationRow
              key={inv.id}
              invitation={inv}
              onUnhide={() => hideInvitation.mutate({ invitationId: inv.id, isHidden: false })}
            />
          ))}
        </ListSection>
      )}
    </Screen>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────────

function CoverThumb({ url }: { url: string | null }) {
  if (url) {
    return <Image source={{ uri: url }} style={styles.thumb} contentFit="cover" transition={150} />;
  }
  return (
    <View style={[styles.thumb, styles.thumbFallback]}>
      <IconSymbol name="envelope.fill" size={22} color={ios.systemGray} />
    </View>
  );
}

function InvitationRow({
  invitation,
  onUnhide,
  isLast = false,
}: {
  invitation: InvitationListItem;
  onUnhide: () => void;
  isLast?: boolean;
}) {
  const router = useRouter();
  const location =
    invitation.eventLocation?.placeName ?? invitation.eventLocation?.address ?? '';
  const dateText = formatEventDate(invitation.eventStartAt);
  const subtitle = location ? `${dateText} · ${location}` : dateText;

  return (
    <View>
      <SwipeableRow rightActions={[{ label: '되돌리기', onPress: onUnhide }]}>
        <Pressable
          onPress={() => router.push(`/invitations/${invitation.id}`)}
          style={styles.row}>
          <CoverThumb url={invitation.mainImageThumbnailUrl ?? invitation.mainImageUrl} />
          <View style={styles.textWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {invitation.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={14} color={ios.tertiaryLabel} weight="semibold" />
        </Pressable>
      </SwipeableRow>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemGroupedBackground,
  },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: iosMetrics.spacing[16], gap: iosMetrics.spacing[2] },
  emptyText: { ...iosType.subhead, color: ios.secondaryLabel },
  emptySub: { ...iosType.footnote, color: ios.tertiaryLabel },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    minHeight: iosMetrics.rowMinHeight,
    paddingVertical: iosMetrics.spacing[2],
    paddingHorizontal: iosMetrics.spacing[4],
    backgroundColor: ios.secondarySystemGroupedBackground,
  },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: iosMetrics.radius.sm },
  thumbFallback: {
    backgroundColor: ios.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  title: { ...iosType.body, color: ios.label },
  subtitle: { ...iosType.footnote, color: ios.secondaryLabel },
  separator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: THUMB_SIZE + iosMetrics.spacing[3] + iosMetrics.spacing[4],
  },
});
