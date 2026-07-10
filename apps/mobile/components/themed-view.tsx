import { View, type ViewProps } from 'react-native';

import { ios } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

/**
 * 기본 배경 = iOS `systemBackground` (PlatformColor가 라이트/다크 자동 처리).
 * `lightColor`/`darkColor`를 주면 해당 스킴 색으로 오버라이드.
 */
export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const scheme = useColorScheme() ?? 'light';
  const override = scheme === 'dark' ? darkColor : lightColor;
  const backgroundColor = override ?? ios.systemBackground;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
