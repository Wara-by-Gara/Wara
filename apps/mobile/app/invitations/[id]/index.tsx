/**
 * 초대장 상세 화면 — 웹 InvitationDetail(GuestView/HostView) IA 미러.
 * 배경 테마 → 커버 → 제목/일시 → 설명(+옵션) → 투표 프리뷰 → 장소 → 참석자 →
 * RSVP → Best9 → 앨범 → 댓글 순. 초대장 캔버스 영역이라 다크 테마 대비색은 hex 허용.
 */

import { useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WaraApiError } from '@/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { BottomSheetRef } from '@/components/ios';
import { InvitationCover } from '@/components/invitation/InvitationCover';
import { RsvpControl } from '@/components/invitation/RsvpControl';
import { ParticipantAvatarRow } from '@/components/invitation/ParticipantAvatarRow';
import {
  CherryBlossomEffect,
  InvitationAnimationLayer,
  InvitationThemeBackground,
  invitationFontStyle,
  isDarkInvitationBg,
} from '@/components/invitation/theme';
import { AccessGate, isInvitationUnlocked } from '@/components/invitation/sections/AccessGate';
import { AlbumSection } from '@/components/invitation/sections/AlbumSection';
import { Best9Banner } from '@/components/invitation/sections/Best9Banner';
import { CommentsSection } from '@/components/invitation/sections/CommentsSection';
import { HostToolsSheet, type HostToolsSheetRef } from '@/components/invitation/sections/HostToolsSheet';
import { LocationSection } from '@/components/invitation/sections/LocationSection';
import { ShareSheet } from '@/components/invitation/sections/ShareSheet';
import { VotePreviewCard } from '@/components/invitation/sections/VotePreviewCard';
import { useInvitation } from '@/hooks/queries/invitations';
import { useMyParticipant, useParticipants } from '@/hooks/queries/participants';
import { ios, iosMetrics, iosType } from '@/theme';

export default function InvitationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: inv, isPending, error } = useInvitation(id);
  const { data: myParticipant } = useMyParticipant(id);
  const { data: participantsData } = useParticipants(id);
  const [unlocked, setUnlocked] = useState(() => isInvitationUnlocked(id));
  const shareRef = useRef<BottomSheetRef>(null);
  const hostToolsRef = useRef<HostToolsSheetRef>(null);

  if (isPending) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '초대장' }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !inv) {
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

  const isHost = inv.myRole === 'HOST';

  // 비밀번호 게이트 — 웹 AccessGate 미러 (참가자·호스트는 통과)
  if (inv.hasPassword && !myParticipant && !isHost && !unlocked) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: inv.title }} />
        <AccessGate invitationId={id} onUnlocked={() => setUnlocked(true)} />
      </View>
    );
  }

  const dark = isDarkInvitationBg(inv.bgColor);
  const canShare = inv.isPublic || !!myParticipant || isHost;
  const canViewFeed = isHost || !!myParticipant;
  const attending = participantsData?.summary.attendingCount ?? 0;
  const onTheme = dark ? styles.onDark : null;
  const onThemeSub = dark ? styles.onDarkSub : null;

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerRight: () => (
            <View style={styles.headerActions}>
              {canShare ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="초대장 공유"
                  onPress={() => shareRef.current?.present()}
                  style={styles.headerButton}>
                  <IconSymbol name="square.and.arrow.up" size={20} color={dark ? '#FFFFFF' : ios.tint} />
                </Pressable>
              ) : null}
              {isHost ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="호스트 메뉴"
                  onPress={() => hostToolsRef.current?.present()}
                  style={styles.headerButton}>
                  <IconSymbol name="ellipsis" size={20} color={dark ? '#FFFFFF' : ios.tint} />
                </Pressable>
              ) : null}
            </View>
          ),
        }}
      />

      {/* 배경 테마 레이어 (캔버스) */}
      <InvitationThemeBackground bgColor={inv.bgColor} />
      <InvitationAnimationLayer animation={inv.animation} />
      <CherryBlossomEffect title={inv.title} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}>
        <InvitationCover invitation={inv} />

        {/* 제목 · 일시 */}
        <View style={styles.headerBlock}>
          <Text style={[styles.title, invitationFontStyle(inv.font), onTheme]}>{inv.title}</Text>
          {inv.eventStartAt ? (
            <Text style={[styles.schedule, onThemeSub]}>{formatKstDateTime(inv.eventStartAt)}</Text>
          ) : null}
        </View>

        {/* 설명 글래스 박스 + 모임 옵션 (웹 InvitationDescriptionBox/InvitationOptions 미러) */}
        {inv.description || inv.fee || inv.dressCode || inv.parkingInfo ? (
          <View style={[styles.descriptionBox, dark && styles.descriptionBoxDark]}>
            {inv.description ? (
              <Text style={[styles.description, onTheme]}>{inv.description}</Text>
            ) : null}
            {(
              [
                ['회비', inv.fee],
                ['드레스코드', inv.dressCode],
                ['공지사항', inv.parkingInfo],
              ] as const
            )
              .filter(([, v]) => !!v)
              .map(([label, value]) => (
                <View key={label} style={styles.optionRow}>
                  <Text style={[styles.optionLabel, onThemeSub]}>{label}</Text>
                  <Text style={[styles.optionValue, onTheme]}>{value}</Text>
                </View>
              ))}
          </View>
        ) : null}

        {/* 일정 투표 프리뷰 */}
        <View style={styles.section}>
          <VotePreviewCard invitationId={id} onDark={dark} />
        </View>

        {/* 장소 카드 (정적맵 미리보기 + 길찾기 + 날씨) */}
        <View style={styles.section}>
          <LocationSection invitation={inv} isHost={isHost} onDark={dark} />
        </View>

        {/* 참석자 아바타 (웹: attendingCount > 0일 때) */}
        {attending > 0 && participantsData ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, onTheme]}>참석자 · {attending}명</Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => router.push(`/invitations/${id}/participants`)}>
                <Text style={styles.sectionAction}>전체보기</Text>
              </Pressable>
            </View>
            <ParticipantAvatarRow
              participants={participantsData.participants}
              onDark={dark}
              onPressAll={() => router.push(`/invitations/${id}/participants`)}
            />
          </View>
        ) : null}

        {/* 참석 여부 (이모지 원형 3버튼) */}
        <View style={styles.section}>
          <RsvpControl invitation={inv} onDark={dark} />
        </View>

        {/* 피드 (Best9 배너 + 앨범 + 댓글) — 웹 canViewFeed 게이트 미러 */}
        {canViewFeed ? (
          <>
            <View style={styles.section}>
              <Best9Banner invitationId={id} />
            </View>
            <View style={styles.section}>
              <AlbumSection invitationId={id} onDark={dark} />
            </View>
            <View style={styles.section}>
              <CommentsSection invitationId={id} onDark={dark} />
            </View>
          </>
        ) : (
          <View style={[styles.feedGate, dark && styles.descriptionBoxDark]}>
            <IconSymbol name="lock.fill" size={22} color={dark ? '#FFFFFF' : ios.secondaryLabel} />
            <Text style={[styles.feedGateText, onThemeSub]}>
              참석 여부를 선택하면 앨범과 댓글을 볼 수 있어요
            </Text>
          </View>
        )}
      </ScrollView>

      <ShareSheet ref={shareRef} invitation={inv} />
      <HostToolsSheet ref={hostToolsRef} invitation={inv} />
    </View>
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
  const period = get('dayPeriod').toLowerCase() === 'am' ? '오전' : '오후';
  const weekday = WEEKDAY_KO[get('weekday')] ?? get('weekday');

  return `${get('month')}월 ${get('day')}일 (${weekday}) ${period} ${get('hour')}:${get('minute')}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ios.systemBackground },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemBackground,
  },
  // iOS 26 네이티브 헤더는 headerRight 커스텀 뷰를 리퀴드 글래스 원(≈53pt)으로 감싸는데,
  // RNS 4.16이 뷰를 원 안에서 상단 정렬해 콘텐츠가 (53−44)/2 ≈ 4pt 아래로 처진다.
  // 버튼을 44pt 정사각(접근성 최소 터치 타깃)으로 고정하고 paddingBottom 8(중심 −4pt)로
  // 보정해 아이콘을 원 중심에 맞춘다 — 시뮬레이터 픽셀 측정으로 검증(1pt 이내).
  headerActions: { flexDirection: 'row', alignItems: 'center', height: iosMetrics.minTouchTarget },
  headerButton: {
    width: iosMetrics.minTouchTarget,
    height: iosMetrics.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  body: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingTop: iosMetrics.spacing[2],
    paddingBottom: iosMetrics.spacing[12],
  },
  headerBlock: { marginTop: iosMetrics.spacing[5], gap: iosMetrics.spacing[2] },
  title: { ...iosType.title1, fontWeight: '800', color: ios.label },
  schedule: { ...iosType.subhead, color: ios.secondaryLabel },
  // 웹 InvitationDescriptionBox 미러 — 반투명 글래스 박스 (캔버스 경계 hex)
  descriptionBox: {
    marginTop: iosMetrics.spacing[5],
    borderRadius: 16,
    padding: iosMetrics.spacing[4],
    gap: iosMetrics.spacing[3],
    backgroundColor: 'rgba(127,127,127,0.10)',
  },
  descriptionBoxDark: { backgroundColor: 'rgba(255,255,255,0.16)' },
  description: { ...iosType.body, color: ios.label },
  optionRow: { flexDirection: 'row', gap: iosMetrics.spacing[3], alignItems: 'flex-start' },
  optionLabel: { ...iosType.footnote, color: ios.secondaryLabel, width: 72 },
  optionValue: { ...iosType.footnote, color: ios.label, flex: 1 },
  section: { marginTop: iosMetrics.spacing[6] },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: iosMetrics.spacing[3],
  },
  sectionTitle: { ...iosType.headline, fontSize: 18, color: ios.label },
  sectionAction: { ...iosType.subhead, color: ios.tint },
  feedGate: {
    marginTop: iosMetrics.spacing[6],
    borderRadius: 16,
    padding: iosMetrics.spacing[6],
    alignItems: 'center',
    gap: iosMetrics.spacing[2],
    backgroundColor: 'rgba(127,127,127,0.10)',
  },
  feedGateText: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },
  onDark: { color: '#FFFFFF' },
  onDarkSub: { color: 'rgba(255,255,255,0.72)' },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.footnote, color: ios.secondaryLabel, textAlign: 'center' },
});
