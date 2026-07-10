import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ios, iosMetrics } from '@/theme';

export type BottomSheetRef = BottomSheetModal;

type BottomSheetProps = {
  children: ReactNode;
  /** 미지정 시 콘텐츠 높이에 맞춰 동적 사이징. */
  snapPoints?: (string | number)[];
};

/**
 * `@gorhom/bottom-sheet` 기반 하단 시트.
 * 사용: `const ref = useRef<BottomSheetRef>(null); ref.current?.present();`
 * 앱 루트에 `BottomSheetModalProvider` + `GestureHandlerRootView` 필요.
 */
export const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(({ children, snapPoints }, ref) => {
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}>
      <BottomSheetView style={styles.content}>{children}</BottomSheetView>
    </BottomSheetModal>
  );
});

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
  background: { backgroundColor: ios.secondarySystemGroupedBackground, borderRadius: iosMetrics.radius['2xl'] },
  handle: { backgroundColor: ios.systemGray3, width: 36 },
  content: { paddingHorizontal: iosMetrics.pagePadding, paddingBottom: iosMetrics.spacing[8] },
});
