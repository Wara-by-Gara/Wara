/**
 * 리마인드 앨범(Best 9) 배너 — 웹 PhotoWithFeedbackContainer 배너 + BestNineModal 미러.
 * 이벤트 시작 7일 경과 && 베스트 사진이 있을 때 그라데이션 배너를 노출하고,
 * 탭하면 BottomSheet로 베스트 사진 그리드(모임명·일자·장수)를 보여준다.
 */

import { useRef } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { BottomSheet, haptics, type BottomSheetRef } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useInvitation } from '@/hooks/queries/invitations';
import { useBest9 } from '@/hooks/queries/photos';
import { ios, iosMetrics, iosType } from '@/theme';

type Props = { invitationId: string };

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const GRID_GAP = iosMetrics.spacing[1];

/** 웹 isMomentLogVisible 미러 — 이벤트 시작 7일 경과 후에만 노출. */
function isMomentLogVisible(eventStartAt: string | null): boolean {
  if (!eventStartAt) return false;
  return Date.now() >= new Date(eventStartAt).getTime() + SEVEN_DAYS_MS;
}

export function Best9Banner({ invitationId }: Props) {
  const sheetRef = useRef<BottomSheetRef>(null);
  const { width } = useWindowDimensions();

  const { data: invitation } = useInvitation(invitationId);
  const showMomentLog = isMomentLogVisible(invitation?.eventStartAt ?? null);
  // 노출 조건 미충족이면 빈 id로 쿼리 비활성 (웹과 동일 패턴).
  const { data: photos } = useBest9(showMomentLog ? invitationId : '');

  if (!showMomentLog || !photos || photos.length === 0) return null;

  const eventDate = invitation?.eventStartAt
    ? new Date(invitation.eventStartAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  // BottomSheet 콘텐츠 좌우 인셋(pagePadding) 제외한 3열 셀 크기.
  const cellSize = (width - iosMetrics.pagePadding * 2 - GRID_GAP * 2) / 3;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="리마인드 앨범 보기"
        onPress={() => {
          haptics.light();
          sheetRef.current?.present();
        }}
        style={({ pressed }) => [styles.bannerWrap, pressed && styles.pressed]}>
        <LinearGradient
          colors={[GRADIENT_FROM, GRADIENT_TO]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerCaption}>모임의 추억을 모아봤어요</Text>
            <Text style={styles.bannerTitle}>리마인드 앨범 보기</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={BANNER_LABEL} />
        </LinearGradient>
      </Pressable>

      <BottomSheet ref={sheetRef}>
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderText}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {invitation?.title ?? '리마인드 앨범'}
            </Text>
            {eventDate ? <Text style={styles.sheetDate}>{eventDate}</Text> : null}
          </View>
          <View style={styles.countBadge}>
            <IconSymbol name="camera.fill" size={12} color={ios.tint} />
            <Text style={styles.countText}>베스트 {photos.length}장</Text>
          </View>
        </View>
        <View style={styles.grid}>
          {photos.map((photo) => (
            <Image
              key={photo.id}
              source={{ uri: photo.url }}
              style={[styles.cell, { width: cellSize, height: cellSize }]}
              contentFit="cover"
              transition={150}
              accessibilityLabel="베스트 사진"
            />
          ))}
        </View>
      </BottomSheet>
    </>
  );
}

// 배너는 초대장 캔버스 요소 — 그라데이션/라벨 hex 허용 (웹 primary→purple 미러).
const GRADIENT_FROM = '#6366F1';
const GRADIENT_TO = '#A855F7';
const BANNER_LABEL = '#FFFFFF';
const BANNER_MUTED = 'rgba(255,255,255,0.8)';

const styles = StyleSheet.create({
  bannerWrap: { borderRadius: iosMetrics.radius.lg, overflow: 'hidden' },
  pressed: { opacity: 0.8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.spacing[4],
    paddingVertical: iosMetrics.spacing[4],
  },
  bannerText: { flex: 1, minWidth: 0, gap: 2 },
  bannerCaption: { ...iosType.footnote, fontWeight: '600', color: BANNER_MUTED },
  bannerTitle: { ...iosType.callout, fontWeight: '700', color: BANNER_LABEL },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    marginTop: iosMetrics.spacing[2],
    marginBottom: iosMetrics.spacing[4],
  },
  sheetHeaderText: { flex: 1, minWidth: 0, gap: 2 },
  sheetTitle: { ...iosType.headline, color: ios.label },
  sheetDate: { ...iosType.footnote, color: ios.secondaryLabel },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[1],
    borderRadius: iosMetrics.radius.full,
    backgroundColor: ios.tertiarySystemFill,
    paddingHorizontal: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[1],
  },
  countText: { ...iosType.footnote, fontWeight: '600', color: ios.tint },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  cell: { borderRadius: iosMetrics.radius.xs, backgroundColor: ios.tertiarySystemFill },
});
