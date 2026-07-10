/**
 * 초대장 공유 시트 — 웹 ShareBottomSheet(공유하기) IA 미러.
 * 공유 링크는 서버(POST /invitations/:id/logs)가 내려주는 `inviteUrl`을 그대로 사용
 * (S-HJNCIM) — 클라이언트에 프론트 베이스 URL을 하드코딩하지 않는다.
 * 카카오톡/인스타그램 공유는 웹 전용 SDK 흐름이라 생략 — iOS 시스템 공유 시트가 대체.
 */

import { useMutation } from '@tanstack/react-query';
import { forwardRef, useRef, useState } from 'react';
import {
  Alert,
  Clipboard,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { apiFetch, newIdempotencyKey, WaraApiError, type Invitation } from '@/api';
import { BottomSheet, haptics, type BottomSheetRef } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import type { SymbolViewProps } from 'expo-symbols';

// ── 공유 로그 API (웹 apps/web/src/lib/api/sendLogs.ts 계약 미러) ──────────────
// 서버가 FRONTEND_URL 기반 inviteUrl(?ref=logId 포함)을 생성해 내려준다.

type ShareChannel = 'link' | 'sms';

type SendLogResponse = {
  inviteUrl: string;
  smsUri?: string;
};

function createSendLog(invitationId: string, channel: ShareChannel) {
  return apiFetch<SendLogResponse>(`/invitations/${invitationId}/logs`, {
    method: 'POST',
    body: { channel },
    idempotencyKey: newIdempotencyKey(),
  });
}

/** WaraApiError code → 사용자 문구. */
function messageForError(error: unknown): string {
  if (error instanceof WaraApiError) {
    switch (error.code) {
      case 'INVITATION_NOT_FOUND':
        return '초대장을 찾을 수 없어요';
      case 'INVITATION_ACCESS_REVOKED':
        return '이 초대장에 접근할 수 없어요';
      case 'IDEMPOTENCY_IN_PROGRESS':
        return '이미 처리 중이에요. 잠시 후 다시 시도해주세요';
      default:
        return '공유 링크를 만들지 못했어요. 다시 시도해주세요';
    }
  }
  return '네트워크 오류 — 잠시 후 다시 시도해주세요';
}

type ShareSheetProps = {
  invitation: Invitation;
};

/**
 * 사용: `const ref = useRef<BottomSheetRef>(null); ref.current?.present();`
 */
export const ShareSheet = forwardRef<BottomSheetRef, ShareSheetProps>(({ invitation }, ref) => {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutateAsync: logShare, isPending } = useMutation({
    mutationFn: (channel: ShareChannel) => createSendLog(invitation.id, channel),
  });

  async function run(channel: ShareChannel, action: (res: SendLogResponse) => Promise<void> | void) {
    try {
      const res = await logShare(channel);
      await action(res);
    } catch (error) {
      haptics.error();
      Alert.alert('알림', messageForError(error));
    }
  }

  // 공유 기본 문구 — 웹 OG 미리보기와 같은 결의 초대 카피.
  const shareMessage = `"${invitation.title}" 초대장이 도착했어요!`;

  const shareLink = () =>
    run('link', async ({ inviteUrl }) => {
      await Share.share({ message: shareMessage, url: inviteUrl });
    });

  const copyLink = () =>
    run('link', ({ inviteUrl }) => {
      // NOTE: RN core Clipboard는 deprecated — expo-clipboard 도입 시 교체 대상.
      Clipboard.setString(inviteUrl);
      haptics.success();
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    });

  const shareViaSms = () =>
    run('sms', async ({ smsUri, inviteUrl }) => {
      await Linking.openURL(smsUri ?? `sms:?body=${encodeURIComponent(inviteUrl)}`);
    });

  return (
    <BottomSheet ref={ref}>
      <Text style={styles.title}>공유하기</Text>
      <View style={styles.options}>
        <ShareOptionRow
          icon="square.and.arrow.up"
          title="링크 공유"
          disabled={isPending}
          onPress={shareLink}
        />
        <ShareOptionRow
          icon={copied ? 'checkmark.circle.fill' : 'doc.on.doc'}
          title={copied ? '복사됨!' : '링크 복사'}
          disabled={isPending}
          onPress={copyLink}
        />
        <ShareOptionRow
          icon="message"
          title="문자로 공유"
          disabled={isPending}
          onPress={shareViaSms}
          isLast
        />
      </View>
    </BottomSheet>
  );
});

ShareSheet.displayName = 'ShareSheet';

function ShareOptionRow({
  icon,
  title,
  onPress,
  disabled = false,
  isLast = false,
}: {
  icon: SymbolViewProps['name'];
  title: string;
  onPress: () => void;
  disabled?: boolean;
  isLast?: boolean;
}) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        disabled={disabled}
        onPress={() => {
          haptics.selection();
          onPress();
        }}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed, disabled && styles.rowDisabled]}>
        <View style={styles.rowIcon}>
          <IconSymbol name={icon} size={20} color={ios.tint} />
        </View>
        <Text style={styles.rowTitle}>{title}</Text>
      </Pressable>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...iosType.headline,
    color: ios.label,
    textAlign: 'center',
    marginTop: iosMetrics.spacing[2],
    marginBottom: iosMetrics.spacing[3],
  },
  options: {
    backgroundColor: ios.tertiarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    overflow: 'hidden',
  },
  row: {
    minHeight: iosMetrics.rowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.spacing[4],
  },
  rowPressed: { backgroundColor: ios.systemFill },
  rowDisabled: { opacity: 0.4 },
  rowIcon: { width: 29, alignItems: 'center' },
  rowTitle: { ...iosType.body, color: ios.label },
  separator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: 29 + iosMetrics.spacing[3] + iosMetrics.spacing[4],
  },
});
