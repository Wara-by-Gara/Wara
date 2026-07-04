/**
 * 모임 앨범 화면 — 사진 3열 그리드, 각 사진 좋아요(낙관적), 탭 시 하단 시트로 확대.
 * 앱 크롬이므로 색상/메트릭은 theme 토큰과 components/ios 킷만 사용.
 * 업로드는 범위 제외(expo-image-picker 미설치) — 조회·좋아요 전용.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { BottomSheet, Button, haptics, type BottomSheetRef } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { WaraApiError, type MobilePhoto } from '@/api';
import { getPhotoPresignedUrl, registerPhoto, photoKeys } from '@/api/photos';
import { useImageUpload } from '@/hooks/useImageUpload';
import {
  useInvitationPhotos,
  useTogglePhotoLike,
} from '@/hooks/queries/photos';

const GRID_GAP = 2;

/** WaraApiError code → 한국어 안내. */
function messageForError(err: unknown): string {
  if (err instanceof WaraApiError) {
    switch (err.code) {
      case 'PHOTO_NOT_FOUND':
        return '사진을 찾을 수 없어요';
      case 'PHOTO_LIKE_ALREADY_EXISTS':
        return '이미 좋아요한 사진이에요';
      case 'PHOTO_LIKE_NOT_FOUND':
        return '좋아요 상태가 아니에요';
      case 'PARTICIPANT_NOT_FOUND':
        return '이 모임의 참가자만 볼 수 있어요';
    }
  }
  return '문제가 발생했어요';
}

export default function PhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const photosQuery = useInvitationPhotos(id);
  const toggleLike = useTogglePhotoLike(id);

  const { width } = useWindowDimensions();
  const itemSize = Math.floor((width - GRID_GAP * 2) / 3);

  const detailSheetRef = useRef<BottomSheetRef>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const photos = useMemo(
    () => photosQuery.data?.pages.flatMap((page) => page.rows) ?? [],
    [photosQuery.data],
  );
  const selected = useMemo(
    () => photos.find((p) => p.id === selectedId) ?? null,
    [photos, selectedId],
  );

  const onLike = (photoId: string) => {
    haptics.light();
    toggleLike.mutate(photoId);
  };

  const openDetail = (photoId: string) => {
    setSelectedId(photoId);
    detailSheetRef.current?.present();
  };

  // ── 업로드: 다중 선택 → useImageUpload → 성공 시 목록 캐시 무효화 ──────────────
  const qc = useQueryClient();
  const upload = useImageUpload<MobilePhoto>({
    getPresignedUrl: (fileName, contentType) =>
      getPhotoPresignedUrl(id, fileName, contentType),
    register: (meta) =>
      registerPhoto(id, meta.imageKey, {
        takenAt: meta.takenAt,
        fileSize: meta.fileSize,
        exifMetadata: meta.exifMetadata,
      }),
  });

  const onUpload = async () => {
    const added = await upload.pickAndUpload({ allowsMultipleSelection: true });
    if (added.length > 0) {
      void qc.invalidateQueries({ queryKey: photoKeys.list(id) });
    }
  };

  // 업로드 실패 시 Alert로 안내(부분 성공도 남은 실패 메시지를 노출).
  useEffect(() => {
    if (upload.error) {
      Alert.alert('업로드', upload.error);
      upload.reset();
    }
  }, [upload.error, upload.reset]);

  const renderHeaderRight = () =>
    upload.uploading ? (
      <ActivityIndicator />
    ) : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="사진 업로드"
        hitSlop={8}
        onPress={onUpload}>
        <IconSymbol name="plus" size={22} color={ios.tint} />
      </Pressable>
    );

  const screenHeader = (
    <Stack.Screen
      options={{ title: '사진', headerLargeTitle: true, headerRight: renderHeaderRight }}
    />
  );

  if (photosQuery.isPending) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (photosQuery.error) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(photosQuery.error)}</Text>
        <Button title="다시 시도" onPress={() => photosQuery.refetch()} />
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <IconSymbol name="photo.on.rectangle" size={44} color={ios.systemGray3} />
        <Text style={styles.emptyText}>아직 올라온 사진이 없어요</Text>
      </View>
    );
  }

  return (
    <>
      {screenHeader}
      <FlatList
        style={styles.list}
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.column}
        contentInsetAdjustmentBehavior="automatic"
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (photosQuery.hasNextPage && !photosQuery.isFetchingNextPage) {
            photosQuery.fetchNextPage();
          }
        }}
        ListFooterComponent={
          photosQuery.isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} />
          ) : null
        }
        renderItem={({ item }) => (
          <PhotoCell
            photo={item}
            size={itemSize}
            onPress={() => openDetail(item.id)}
            onLike={() => onLike(item.id)}
          />
        )}
      />

      <BottomSheet ref={detailSheetRef}>
        {selected ? (
          <View style={styles.detail}>
            <Image
              source={{ uri: selected.url }}
              style={[styles.detailImage, { maxHeight: width }]}
              contentFit="contain"
              transition={150}
            />
            <View style={styles.detailMeta}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onLike(selected.id)}
                style={styles.detailLike}>
                <IconSymbol
                  name={selected.liked ? 'heart.fill' : 'heart'}
                  size={22}
                  color={selected.liked ? ios.systemRed : ios.secondaryLabel}
                />
                <Text style={styles.detailCount}>{selected.likeCount}</Text>
              </Pressable>
              <View style={styles.detailLike}>
                <IconSymbol name="bubble.right" size={20} color={ios.secondaryLabel} />
                <Text style={styles.detailCount}>{selected.feedbackCount}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </>
  );
}

/** 그리드 셀 — 정사각 썸네일 + 좌하단 좋아요 버튼(낙관적). */
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
      style={({ pressed }) => [{ width: size, height: size }, pressed && styles.cellPressed]}>
      <Image
        source={{ uri: photo.url }}
        style={styles.cellImage}
        contentFit="cover"
        transition={150}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="좋아요"
        hitSlop={6}
        onPress={onLike}
        style={styles.likePill}>
        <IconSymbol
          name={photo.liked ? 'heart.fill' : 'heart'}
          size={13}
          color={photo.liked ? ios.systemRed : ios.secondaryLabel}
        />
        {photo.likeCount > 0 ? (
          <Text style={styles.likeCount}>{photo.likeCount}</Text>
        ) : null}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: ios.systemGroupedBackground },
  column: { gap: GRID_GAP },
  footer: { paddingVertical: iosMetrics.spacing[4] },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemGroupedBackground,
  },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },
  emptyText: { ...iosType.subhead, color: ios.secondaryLabel },
  cellPressed: { opacity: 0.7 },
  cellImage: { flex: 1, marginBottom: GRID_GAP, backgroundColor: ios.systemGray5 },
  likePill: {
    position: 'absolute',
    left: iosMetrics.spacing[1],
    bottom: iosMetrics.spacing[1] + GRID_GAP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: iosMetrics.spacing[2],
    paddingVertical: 3,
    borderRadius: iosMetrics.radius.full,
    backgroundColor: ios.secondarySystemGroupedBackground,
  },
  likeCount: { ...iosType.caption2, fontWeight: '600', color: ios.label },
  detail: { gap: iosMetrics.spacing[4], paddingTop: iosMetrics.spacing[2] },
  detailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: iosMetrics.radius.lg,
    backgroundColor: ios.systemGray5,
  },
  detailMeta: { flexDirection: 'row', gap: iosMetrics.spacing[5] },
  detailLike: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[2] },
  detailCount: { ...iosType.subhead, color: ios.label },
});
