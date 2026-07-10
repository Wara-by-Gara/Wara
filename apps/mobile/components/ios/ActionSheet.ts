import { ActionSheetIOS } from 'react-native';

import { haptics } from './Haptics';

export type ActionSheetOption = {
  label: string;
  onPress?: () => void;
  destructive?: boolean;
};

/**
 * 네이티브 iOS 액션 시트 (`ActionSheetIOS`).
 * 취소 버튼은 자동 추가. 첫 destructive 옵션이 빨간색으로 표시된다.
 */
export function showActionSheet(opts: {
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
}) {
  const { title, message, options, cancelLabel = '취소' } = opts;
  const labels = [...options.map((o) => o.label), cancelLabel];
  const cancelButtonIndex = labels.length - 1;
  const destructiveIndex = options.findIndex((o) => o.destructive);

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title,
      message,
      options: labels,
      cancelButtonIndex,
      destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
    },
    (index) => {
      const option = options[index];
      if (option) {
        haptics.selection();
        option.onPress?.();
      }
    },
  );
}
