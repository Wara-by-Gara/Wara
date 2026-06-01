import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { fetchEventLocation, locationKeys } from '@/api';
import { colors, typography } from '@/constants/tokens';
import { useLocation } from '@/hooks/useLocation';
import { useLocationSocket, type WsParticipantLocation } from '@/hooks/useLocationSocket';
import KakaoMapView, { type ParticipantPin } from './KakaoMapView';

type Props = {
  invitationId: string;
};

export default function MapContainer({ invitationId }: Props) {
  const { coords, permission } = useLocation();
  const { participantLocations, connected, sendLocation } = useLocationSocket({ invitationId });

  const eventLocationQuery = useQuery({
    queryKey: locationKeys.eventLocation(invitationId),
    queryFn: ({ signal }) => fetchEventLocation(invitationId, { signal }),
    retry: 1,
  });

  const lastSentRef = useRef<typeof coords>(null);

  useEffect(() => {
    if (!connected || !coords) return;
    lastSentRef.current = coords;
    sendLocation({ lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy });
  // sendLocation의 참조가 변해도 재구독 안 함 — coords, connected만 추적
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, connected]);

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
      {!connected && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>연결 중...</Text>
        </View>
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
