import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { fetchMyPhotoLocations, photoKeys, type MobilePhotoLocation } from '@/api';
import { colors, spacing, typography } from '@/constants/tokens';
import PhotoKakaoMapView, { type PhotoMapMarker } from './PhotoKakaoMapView';

// ── 클러스터링 ────────────────────────────────────────────────────────────────
const CLUSTER_RADIUS_M = 30;

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

interface Cluster {
  id: string;
  lat: number;
  lng: number;
  representativeUrl: string;
  count: number;
  photos: MobilePhotoLocation[];
}

function clusterPhotos(photos: MobilePhotoLocation[]): Cluster[] {
  const assigned = new Set<string>();
  const clusters: Cluster[] = [];

  for (const photo of photos) {
    if (assigned.has(photo.id)) continue;

    const group: MobilePhotoLocation[] = [photo];
    assigned.add(photo.id);

    for (const other of photos) {
      if (assigned.has(other.id)) continue;
      if (haversineMeters(photo.gpsLat, photo.gpsLng, other.gpsLat, other.gpsLng) <= CLUSTER_RADIUS_M) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    const sorted = [...group].sort((a, b) => {
      const ta = new Date(a.takenAt ?? a.createdAt).getTime();
      const tb = new Date(b.takenAt ?? b.createdAt).getTime();
      return tb - ta;
    });

    const rep = sorted[0]!;
    const lat = group.reduce((s, p) => s + p.gpsLat, 0) / group.length;
    const lng = group.reduce((s, p) => s + p.gpsLng, 0) / group.length;

    clusters.push({
      id: rep.id,
      lat,
      lng,
      representativeUrl: rep.url,
      count: group.length,
      photos: sorted,
    });
  }

  return clusters;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function PhotoMapContainer() {
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [detailPhoto, setDetailPhoto] = useState<MobilePhotoLocation | null>(null);

  const { data: photoLocations = [], isLoading } = useQuery({
    queryKey: photoKeys.myLocations,
    queryFn: ({ signal }) => fetchMyPhotoLocations({ signal }),
  });

  const clusters = useMemo(() => clusterPhotos(photoLocations), [photoLocations]);

  const photoMarkers: PhotoMapMarker[] = clusters.map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    url: c.representativeUrl,
    count: c.count,
  }));

  function handleMarkerClick(markerId: string) {
    const cluster = clusters.find((c) => c.id === markerId);
    if (!cluster) return;
    if (cluster.count === 1) {
      setDetailPhoto(cluster.photos[0]!);
    } else {
      setSelectedCluster(cluster);
    }
  }

  function closeSheet() {
    setSelectedCluster(null);
  }

  function closeDetail() {
    setDetailPhoto(null);
  }

  const PHOTO_COLS = 3;

  return (
    <View style={styles.container}>
      <PhotoKakaoMapView markers={photoMarkers} onMarkerClick={handleMarkerClick} />

      {/* 로딩 */}
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.overlayText}>사진 불러오는 중...</Text>
        </View>
      )}

      {/* 사진 없음 */}
      {!isLoading && photoLocations.length === 0 && (
        <View style={styles.overlay}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>위치 정보가 있는 사진이 없어요</Text>
            <Text style={styles.emptyDesc}>
              GPS 정보가 담긴 사진을 업로드하면{'\n'}여기서 확인할 수 있어요
            </Text>
          </View>
        </View>
      )}

      {/* 위치별 사진 목록 시트 */}
      <Modal
        visible={selectedCluster !== null}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                이 장소의 사진 {selectedCluster?.count ?? 0}장
              </Text>
              <TouchableOpacity onPress={closeSheet} hitSlop={12} accessibilityLabel="닫기">
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedCluster?.photos ?? []}
              keyExtractor={(item) => item.id}
              numColumns={PHOTO_COLS}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => {
                    closeSheet();
                    setDetailPhoto(item);
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.url }} style={styles.gridImage} contentFit="cover" />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.gridContent}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* 사진 상세 */}
      <Modal
        visible={detailPhoto !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={closeDetail}
      >
        <SafeAreaView style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={closeDetail} hitSlop={12} accessibilityLabel="닫기">
              <Text style={styles.detailClose}>✕</Text>
            </TouchableOpacity>
            {detailPhoto?.takenAt && (
              <Text style={styles.detailDate}>
                {new Date(detailPhoto.takenAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            )}
            <View style={styles.detailLikeRow}>
              <Text style={styles.detailLikeIcon}>♥</Text>
              <Text style={styles.detailLikeCount}>{detailPhoto?.likeCount ?? 0}</Text>
            </View>
          </View>
          {detailPhoto && (
            <Image
              source={{ uri: detailPhoto.url }}
              style={styles.detailImage}
              contentFit="contain"
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing[3],
  },
  emptyBox: {
    backgroundColor: colors.surfaceBlurred,
    borderRadius: 20,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[6],
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.title2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    ...typography.body3,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: 20,
  },

  // 목록 시트
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlayBackdrop,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '65%',
    paddingBottom: spacing[4],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  sheetTitle: {
    ...typography.title1,
    color: colors.textPrimary,
  },
  sheetClose: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  gridContent: {
    gap: 2,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },

  // 사진 상세
  detailContainer: {
    flex: 1,
    backgroundColor: colors.textPrimary,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  detailClose: {
    fontSize: 22,
    color: colors.textInverse,
  },
  detailDate: {
    ...typography.body3,
    color: colors.textInverseMuted,
    flex: 1,
  },
  detailLikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  detailLikeIcon: {
    fontSize: 14,
    color: colors.primary,
  },
  detailLikeCount: {
    ...typography.body3,
    color: colors.textInverse,
  },
  detailImage: {
    flex: 1,
    width: '100%',
  },
});
