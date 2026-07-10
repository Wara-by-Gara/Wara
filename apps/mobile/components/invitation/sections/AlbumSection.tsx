/**
 * 초대장 상세 인라인 앨범 섹션 — 웹 PhotoWithFeedback/Album 미러.
 * 헤더("사진 앨범" + "N개의 사진" + 원형 카메라 업로드 버튼), 3열 그리드 첫 5장 +
 * 6번째 "+N" 셀, 셀 우하단 좋아요 오버레이(낙관적), 빈 상태 업로드 유도.
 * 사진/"+N" 탭 → 전체 앨범 화면으로 이동.
 *
 * onDark: 초대장 캔버스(어두운 배경) 위 배치용 — 캔버스 경계라 hex/rgba 허용.
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { haptics } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import type { MobilePhoto } from '@/api/photos';
import { getPhotoPresignedUrl, photoKeys, registerPhoto } from '@/api/photos';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useInvitationPhotos, useTogglePhotoLike } from '@/hooks/queries/photos';

/** 웹 Album previewLimit 미러 — 첫 5장 + "+N" 셀. */
const PREVIEW_LIMIT = 5;
const GRID_GAP = 2;

interface Props {
  invitationId: string;
  /** 어두운 초대장 캔버스 위 배치 여부 — 텍스트를 흰색 계열로 전환. */
  onDark?: boolean;
}

export function AlbumSection({ invitationId, onDark }: Props) {
  const router = useRouter();
  const qc = useQueryClient();

  const photosQuery = useInvitationPhotos(invitationId);
  const toggleLike = useTogglePhotoLike(invitationId);

  // 인라인 섹션은 부모 폭을 알 수 없어 onLayout으로 실측 후 셀 크기 계산.
  const [gridWidth, setGridWidth] = useState(0);
  const cellSize = gridWidth > 0 ? Math.floor((gridWidth - GRID_GAP * 2) / 3) : 0;

  const upload = useImageUpload<MobilePhoto>({
    getPresignedUrl: (fileName, contentType) =>
      getPhotoPresignedUrl(invitationId, fileName, contentType),
    register: (meta) =>
      registerPhoto(invitationId, meta.imageKey, {
        takenAt: meta.takenAt,
        fileSize: meta.fileSize,
        exifMetadata: meta.exifMetadata,
      }),
  });

  useEffect(() => {
    if (upload.error) {
      Alert.alert('업로드', upload.error);
      upload.reset();
    }
  }, [upload.error, upload.reset]);

  const onUpload = async () => {
    const added = await upload.pickAndUpload({ allowsMultipleSelection: true });
    if (added.length > 0) {
      void qc.invalidateQueries({ queryKey: photoKeys.list(invitationId) });
    }
  };

  const photos = photosQuery.data?.pages.flatMap((page) => page.rows) ?? [];
  const preview = photos.slice(0, PREVIEW_LIMIT);
  // 웹 totalForOverflow 미러: 더 불러올 페이지가 있으면 API total, 전부 로드됐으면 실제 개수.
  const apiTotal = photosQuery.data?.pages[0]?.total ?? 0;
  const total = photosQuery.hasNextPage ? Math.max(apiTotal, photos.length) : photos.length;
  const remaining = Math.max(total - preview.length, 0);

  const openAlbum = () => router.push(`/invitations/${invitationId}/photos`);

  const onLike = (photoId: string) => {
    haptics.light();
    toggleLike.mutate(photoId);
  };

  const titleColor = onDark ? '#FFFFFF' : ios.label;
  const subtitleColor = onDark ? 'rgba(255,255,255,0.7)' : ios.secondaryLabel;
  const mutedColor = onDark ? 'rgba(255,255,255,0.8)' : ios.secondaryLabel;

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: titleColor }]}>사진 앨범</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>{total}개의 사진</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="사진 올리기"
          hitSlop={6}
          disabled={upload.uploading}
          onPress={onUpload}
          style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}>
          {upload.uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <IconSymbol name="camera.fill" size={16} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {upload.uploading && upload.progress ? (
        <Text style={[styles.progressText, { color: subtitleColor }]}>
          사진 {upload.progress.total}장 중 {upload.progress.completed}장 업로드 중...
        </Text>
      ) : null}

      <View onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
        {photosQuery.isPending ? (
          <ActivityIndicator style={styles.stateBlock} />
        ) : photosQuery.error ? (
          <Text style={[styles.stateBlock, styles.stateText, { color: mutedColor }]}>
            사진을 불러오지 못했어요
          </Text>
        ) : photos.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="우리 추억을 업로드 해보세요"
            onPress={onUpload}
            style={({ pressed }) => [styles.empty, pressed && styles.pressed]}>
            <IconSymbol name="camera" size={28} color={mutedColor} />
            <Text style={[styles.emptyText, { color: mutedColor }]}>
              우리 추억을 업로드 해보세요
            </Text>
          </Pressable>
        ) : cellSize > 0 ? (
          <View style={styles.grid}>
            {preview.map((photo) => (
              <PhotoCell
                key={photo.id}
                photo={photo}
                size={cellSize}
                onPress={openAlbum}
                onLike={() => onLike(photo.id)}
              />
            ))}
            {remaining > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`사진 ${remaining}장 더 보기`}
                onPress={openAlbum}
                style={({ pressed }) => [
                  styles.overflowCell,
                  { width: cellSize, height: cellSize },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.overflowLabel, { color: onDark ? '#FFFFFF' : ios.secondaryLabel }]}>
                  +{remaining}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** 정사각 썸네일 + 우하단 좋아요 오버레이(웹 PhotoGridItem 미러). 이미지 위 오버레이라 hex 사용. */
function PhotoCell({
  photo,
  size,
  onPress,
  onLike,
}: {
  photo: MobilePhoto;
  size: number;
  onPress: () => void;
  onLike: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="imagebutton"
      onPress={onPress}
      style={({ pressed }) => [{ width: size, height: size }, pressed && styles.pressed]}>
      <Image source={{ uri: photo.url }} style={styles.cellImage} contentFit="cover" transition={150} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photo.liked ? '좋아요 취소' : '좋아요'}
        hitSlop={6}
        onPress={onLike}
        style={styles.likePill}>
        <IconSymbol
          name={photo.liked ? 'heart.fill' : 'heart'}
          size={12}
          color={photo.liked ? '#FF453A' : '#FFFFFF'}
        />
        <Text style={styles.likeCount}>{photo.likeCount}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: iosMetrics.spacing[3],
    marginBottom: iosMetrics.spacing[2],
  },
  headerText: { flexShrink: 1, gap: 2 },
  title: { ...iosType.headline, fontWeight: '700' },
  subtitle: { ...iosType.caption1 },
  uploadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ios.tint,
  },
  pressed: { opacity: 0.7 },
  progressText: { ...iosType.caption1, marginBottom: iosMetrics.spacing[2] },
  stateBlock: { paddingVertical: iosMetrics.spacing[6] },
  stateText: { ...iosType.subhead, textAlign: 'center' },
  empty: {
    alignItems: 'center',
    gap: iosMetrics.spacing[2],
    paddingVertical: iosMetrics.spacing[8],
  },
  emptyText: { ...iosType.subhead, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  cellImage: {
    width: '100%',
    height: '100%',
    // 사진 로딩 전 placeholder — 캔버스 위에서도 무난한 중립 회색(hex, 캔버스 경계 예외).
    backgroundColor: 'rgba(120,120,128,0.2)',
  },
  overflowCell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,120,128,0.24)',
  },
  overflowLabel: { ...iosType.body, fontWeight: '600' },
  likePill: {
    position: 'absolute',
    right: iosMetrics.spacing[1],
    bottom: iosMetrics.spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: iosMetrics.spacing[2] - 2,
    paddingVertical: 2,
    borderRadius: iosMetrics.radius.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  likeCount: { ...iosType.caption2, fontWeight: '600', color: '#FFFFFF' },
});
