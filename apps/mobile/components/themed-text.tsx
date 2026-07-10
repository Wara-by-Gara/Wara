import { StyleSheet, Text, type TextProps } from 'react-native';

import { ios, iosType } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

/**
 * iOS 타입 스케일 매핑:
 * - default = Body (17)
 * - defaultSemiBold = Headline (17/600)
 * - title = Large Title (34/700)
 * - subtitle = Title 3 (20)
 * - link = Body + tint(systemBlue)
 *
 * 색은 iOS `label`(PlatformColor, 라이트/다크 자동). link는 `systemBlue`.
 */
export function ThemedText({ style, lightColor, darkColor, type = 'default', ...rest }: ThemedTextProps) {
  const scheme = useColorScheme() ?? 'light';
  const override = scheme === 'dark' ? darkColor : lightColor;
  const color = type === 'link' ? ios.tint : (override ?? ios.label);

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: iosType.body,
  defaultSemiBold: iosType.headline,
  title: iosType.largeTitle,
  subtitle: iosType.title3,
  link: iosType.body,
});
