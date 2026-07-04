/**
 * 초대장 상세 상단 커버 카드.
 * mainImageUrl이 있으면 라운드 이미지 카드(4:5), 없으면 절제된 iOS 톤 플레이스홀더.
 */

import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { Invitation } from '@/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';

type Props = { invitation: Invitation };

export function InvitationCover({ invitation }: Props) {
  const uri = invitation.mainImageUrl ?? invitation.mainImageThumbnailUrl;

  if (uri) {
    return (
      <View style={styles.card}>
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          accessibilityLabel={invitation.title}
        />
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.placeholder]}>
      <IconSymbol name="photo" size={44} color={ios.tertiaryLabel} />
      <Text style={styles.placeholderText} numberOfLines={2}>
        {invitation.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 4 / 5,
    borderRadius: iosMetrics.radius.lg,
    overflow: 'hidden',
    backgroundColor: ios.secondarySystemGroupedBackground,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.spacing[5],
  },
  placeholderText: {
    ...iosType.headline,
    color: ios.secondaryLabel,
    textAlign: 'center',
  },
});
