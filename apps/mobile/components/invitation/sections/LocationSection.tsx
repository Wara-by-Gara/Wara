/**
 * 초대장 상세 — 장소 카드 섹션.
 * 웹 LocationWithDate + LocationCard(variant preview/unknown) 미러:
 * 장소명·주소 + 지도 메뉴(카카오맵 길찾기), 정적 지도 미리보기(탭 → 지도 화면),
 * 인라인 날씨(이벤트 3일 이내 + 미래일 때만), 장소 미정 안내(+호스트 설정 유도).
 */

import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Invitation } from '@/api/invitations';
import type { WeatherConditionKo } from '@/api/weather';
import { showActionSheet } from '@/components/ios';
import { KakaoStaticMapPreview } from '@/components/KakaoStaticMapPreview';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useWeather } from '@/hooks/queries/weather';
import { ios, iosMetrics, iosType } from '@/theme';

type Props = {
  invitation: Invitation;
  isHost: boolean;
  /** 어두운 초대장 캔버스 위 렌더 (캔버스 경계 — hex 허용). */
  onDark?: boolean;
};

// 웹 WEATHER_META(WeatherCard.tsx) 미러 — 서버 한국어 condition → 이모지.
const WEATHER_EMOJI: Record<WeatherConditionKo, string> = {
  '맑음': '☀️',
  '구름 조금': '⛅',
  '흐림': '☁️',
  '비': '🌧️',
  '비/눈': '🌨️',
  '소나기': '🌦️',
  '눈': '❄️',
};

/** 카카오맵 앱 길찾기 → 미설치 시 웹 길찾기 폴백. */
function openDirections(placeName: string, lat: number, lng: number) {
  const appUrl = `kakaomap://route?ep=${lat},${lng}&by=CAR`;
  const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(placeName)},${lat},${lng}`;
  Linking.openURL(appUrl).catch(() => {
    Linking.openURL(webUrl).catch(() => {
      // 브라우저조차 열 수 없는 극단 상황 — 조용히 무시 (unhandled rejection 방지)
    });
  });
}

export function LocationSection({ invitation, isHost, onDark = false }: Props) {
  const router = useRouter();
  const location = invitation.eventLocation;

  const { data: weather } = useWeather(invitation.id, invitation.eventStartAt, {
    enabled: !!location,
  });
  const weatherEmoji = weather ? WEATHER_EMOJI[weather.condition] : undefined;

  const titleColor = onDark ? styles.titleDark : styles.titleLight;
  const mutedColor = onDark ? styles.mutedDark : styles.mutedLight;

  if (!location) {
    return (
      <View style={styles.unknownContainer}>
        <IconSymbol
          name="mappin.and.ellipse"
          size={28}
          color={onDark ? DARK_MUTED : ios.secondaryLabel}
        />
        <Text style={[styles.unknownTitle, titleColor]}>장소가 아직 정해지지 않았어요</Text>
        <Text style={[styles.unknownBody, mutedColor]}>
          {isHost
            ? '장소를 설정하면 참가자에게 알려드려요'
            : '호스트가 장소를 정하면 알려드릴게요'}
        </Text>
      </View>
    );
  }

  const fullAddress = location.detailAddress
    ? `${location.address} ${location.detailAddress}`
    : location.address;

  const openAddressMenu = () => {
    showActionSheet({
      title: location.placeName,
      message: fullAddress,
      options: [
        {
          label: '길찾기',
          onPress: () => openDirections(location.placeName, location.lat, location.lng),
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.placeName, titleColor]}>{location.placeName}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="길찾기 메뉴"
            hitSlop={8}
            onPress={openAddressMenu}
            style={({ pressed }) => [styles.addressRow, pressed && styles.pressed]}>
            <Text style={[styles.address, mutedColor]}>{fullAddress}</Text>
            <IconSymbol
              name="map"
              size={14}
              color={onDark ? DARK_MUTED : ios.secondaryLabel}
              style={styles.addressIcon}
            />
          </Pressable>
        </View>
        {weather && weatherEmoji ? (
          <View style={styles.weatherSlot}>
            <Text style={styles.weatherEmoji}>{weatherEmoji}</Text>
            <Text style={[styles.weatherTemp, mutedColor]}>{weather.temperature}°C</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="지도에서 보기"
        onPress={() => router.push(`/invitations/${invitation.id}/map`)}
        style={({ pressed }) => [styles.mapWrap, pressed && styles.pressed]}>
        <KakaoStaticMapPreview lat={location.lat} lng={location.lng} height={160} />
      </Pressable>
    </View>
  );
}

// 캔버스(onDark) 경계 전용 hex — 앱 크롬에는 사용 금지.
const DARK_LABEL = '#FFFFFF';
const DARK_MUTED = 'rgba(255,255,255,0.72)';

const styles = StyleSheet.create({
  container: { gap: iosMetrics.spacing[3] },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: iosMetrics.spacing[3],
  },
  headerText: { flex: 1, minWidth: 0, gap: iosMetrics.spacing[1] },
  placeName: { ...iosType.headline },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: iosMetrics.spacing[1],
  },
  address: { ...iosType.footnote, flexShrink: 1 },
  addressIcon: { marginTop: 1 },
  weatherSlot: { alignItems: 'center', gap: iosMetrics.spacing[1], paddingTop: 2 },
  weatherEmoji: { fontSize: 20, lineHeight: 24 },
  weatherTemp: { ...iosType.footnote, fontWeight: '500' },
  mapWrap: { borderRadius: iosMetrics.radius.md, overflow: 'hidden' },
  pressed: { opacity: 0.7 },

  unknownContainer: {
    alignItems: 'center',
    gap: iosMetrics.spacing[2],
    paddingVertical: iosMetrics.spacing[5],
  },
  unknownTitle: { ...iosType.subhead, fontWeight: '600', textAlign: 'center' },
  unknownBody: { ...iosType.footnote, textAlign: 'center' },

  titleLight: { color: ios.label },
  titleDark: { color: DARK_LABEL },
  mutedLight: { color: ios.secondaryLabel },
  mutedDark: { color: DARK_MUTED },
});
