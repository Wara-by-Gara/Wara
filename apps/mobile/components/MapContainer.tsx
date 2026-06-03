import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { fetchEventLocation, locationKeys } from '@/api';
import { colors, typography } from '@/constants/tokens';
import { useLocation } from '@/hooks/useLocation';
import { useLocationSocket, type WsParticipantLocation } from '@/hooks/useLocationSocket';
import KakaoMapView, { type ParticipantPin } from './KakaoMapView';

// 위치 throttle 거리 계산 — PhotoMapContainer와 동일 공식, 짧으니 인라인 유지.
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Props = {
  invitationId: string;
};

export default function MapContainer({ invitationId }: Props) {
  const { coords, permission } = useLocation();
  const { participantLocations, connected, authError, sendLocation } = useLocationSocket({ invitationId });

  const eventLocationQuery = useQuery({
    queryKey: locationKeys.eventLocation(invitationId),
    queryFn: ({ signal }) => fetchEventLocation(invitationId, { signal }),
    retry: 1,
  });

  const lastSentRef = useRef<typeof coords>(null);
  const lastSentAtRef = useRef<number>(0);

  // 위치 정확도가 미세하게 변할 때마다 effect 발화 → WS spam 방지.
  // 최소 SEND_INTERVAL_MS 경과 또는 SEND_MIN_DISTANCE_M 이상 이동 시에만 emit.
  const SEND_INTERVAL_MS = 5000;
  const SEND_MIN_DISTANCE_M = 10;

  useEffect(() => {
    if (!connected || !coords) return;
    const now = Date.now();
    const last = lastSentRef.current;
    const elapsed = now - lastSentAtRef.current;
    const moved = last
      ? haversineMeters(last.lat, last.lng, coords.lat, coords.lng)
      : Infinity;
    if (elapsed < SEND_INTERVAL_MS && moved < SEND_MIN_DISTANCE_M) return;
    lastSentRef.current = coords;
    lastSentAtRef.current = now;
    sendLocation({ lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy });
  // sendLocation의 참조가 변해도 재구독 안 함 — coords, connected만 추적
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, connected]);

  // backend의 location.gateway는 페이로드에 participantId만 포함시키고
  // nickname/profileImageUrl은 보내지 않음 (apps/api/src/locations/locations.gateway.ts).
  // 별도 PR에서 backend가 user 정보를 같이 emit하거나, 여기서 participants API로
  // 한 번 fetch 후 캐시해서 매핑하는 방식 검토 필요.
  const participantPins: ParticipantPin[] = useMemo(
    () =>
      Array.from(participantLocations.values()).map((loc: WsParticipantLocation) => ({
        participantId: loc.participantId,
        lat: loc.lat,
        lng: loc.lng,
        nickname: null,
        profileImageUrl: null,
        isArrived: loc.isArrived,
      })),
    [participantLocations],
  );

  const eventLocation = eventLocationQuery.data
    ? {
        lat: eventLocationQuery.data.lat,
        lng: eventLocationQuery.data.lng,
        placeName: eventLocationQuery.data.placeName,
      }
    : undefined;

  const myLocation = coords ? { lat: coords.lat, lng: coords.lng } : undefined;

  if (permission === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.msg}>위치 권한 확인 중...</Text>
      </View>
    );
  }

  if (permission === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.msgTitle}>위치 권한이 필요합니다</Text>
        <Text style={styles.msg}>설정에서 위치 권한을 허용해 주세요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KakaoMapView
        eventLocation={eventLocation}
        participants={participantPins}
        myLocation={myLocation}
      />
      {authError ? (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>인증이 만료되었어요. 다시 로그인해 주세요.</Text>
        </View>
      ) : (
        !connected && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>연결 중...</Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  msgTitle: {
    ...typography.title1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  msg: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  offlineBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: colors.textSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  offlineText: {
    ...typography.caption1,
    color: colors.textInverse,
  },
});
