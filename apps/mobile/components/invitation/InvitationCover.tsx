/**
 * 초대장 상세 상단 커버 — 웹 InvitationCover(detailMode) + invitationDetailCover 미러.
 * mainCoverType 분기: gif → GIF 재생(expo-image), image(기본 이미지 제외) → 원본 비율(크롭 없음),
 * 그 외 → bgColor 컬러 커버. 초대장 캔버스 요소라 hex 사용.
 */

import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Invitation } from '@/api';
import { iosMetrics } from '@/theme';

type Props = { invitation: Invitation };

const DEFAULT_RATIO = 4 / 5;

/** #RRGGBB 검증 — 서버 bgColor가 비정상이면 흰색 폴백. */
function normalizeHex(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color.trim()) ? color.trim() : '#FFFFFF';
}

/** 배경 밝기 기준 텍스트 대비색 선택. */
function isDarkHex(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

export function InvitationCover({ invitation }: Props) {
  const [ratio, setRatio] = useState<number | null>(null);

  // 웹 getInvitationDetailCover 분기 미러
  const hasGif = invitation.mainCoverType === 'gif' && !!invitation.mainGifUrl;
  const hasImage =
    invitation.mainCoverType === 'image' &&
    !!invitation.mainImageUrl &&
    !(invitation.mainImageKey?.includes('defaults/') ?? false);
  const mediaUrl = hasGif ? invitation.mainGifUrl : hasImage ? invitation.mainImageUrl : null;

  if (mediaUrl) {
    return (
      <View style={[styles.card, { aspectRatio: ratio ?? DEFAULT_RATIO }]}>
        <Image
          source={{ uri: mediaUrl }}
          style={styles.media}
          contentFit="cover"
          transition={200}
          onLoad={(event) => {
            const { width, height } = event.source;
            if (width > 0 && height > 0) setRatio(width / height);
          }}
          accessibilityLabel={invitation.title}
        />
      </View>
    );
  }

  const bgColor = normalizeHex(invitation.bgColor);
  return (
    <View style={[styles.card, styles.colorCover, { backgroundColor: bgColor }]}>
      <Text
        style={[styles.colorTitle, { color: isDarkHex(bgColor) ? '#FFFFFF' : '#1A1A1A' }]}
        numberOfLines={2}>
        {invitation.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: iosMetrics.radius.xs,
    overflow: 'hidden',
  },
  media: { width: '100%', height: '100%' },
  colorCover: {
    aspectRatio: DEFAULT_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: iosMetrics.spacing[5],
  },
  colorTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
