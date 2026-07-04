import RNSegmentedControl from '@react-native-segmented-control/segmented-control';
import type { ViewStyle } from 'react-native';

import { haptics } from './Haptics';

type SegmentedControlProps = {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
};

/**
 * 네이티브 iOS `UISegmentedControl` 래퍼. 값 전환 시 selection 햅틱.
 */
export function SegmentedControl({ values, selectedIndex, onChange, style }: SegmentedControlProps) {
  return (
    <RNSegmentedControl
      values={values}
      selectedIndex={selectedIndex}
      onChange={(e) => {
        haptics.selection();
        onChange(e.nativeEvent.selectedSegmentIndex);
      }}
      style={style}
    />
  );
}
