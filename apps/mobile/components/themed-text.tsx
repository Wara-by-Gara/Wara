import { StyleSheet, Text, type TextProps } from 'react-native';

import { typography } from '@/constants/tokens';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const tint = useThemeColor({}, 'tint');

  // link 색상은 토큰(primary)에서 가져옴 — 라이트/다크 자동 분기
  return (
    <Text
      style={[
        type === 'link' ? { color: tint } : { color },
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

// DESIGN.md §5 type scale 매핑:
// - default = Body 1, defaultSemiBold = Body 1 + 600
// - title = Display 1 (32/40/800)
// - subtitle = Heading 3 (20/28/700)
// - link = Body 1 + tint 컬러 (정확한 Type 토큰은 별도 없음)
const styles = StyleSheet.create({
  default: typography.body1,
  defaultSemiBold: { ...typography.body1, fontWeight: '600' },
  title: typography.display1,
  subtitle: typography.heading3,
  link: typography.body1,
});
