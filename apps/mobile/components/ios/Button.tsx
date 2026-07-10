import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { ios, iosMetrics, iosType, resolveIosHex } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { haptics } from './Haptics';

type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'destructive';
type ButtonSize = 'large' | 'medium';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** 눌렀을 때 햅틱 (기본 'light'). null이면 없음. */
  haptic?: 'light' | 'medium' | 'success' | null;
  style?: ViewStyle;
};

/**
 * iOS 스타일 버튼.
 * - filled: systemBlue 배경 + 흰 글자 (주요 CTA)
 * - tinted: systemBlue 연한 배경 + systemBlue 글자
 * - plain: 배경 없음 + systemBlue 글자 (텍스트 버튼)
 * - destructive: systemRed 계열
 *
 * iOS 26에서는 filled/tinted/destructive 배경이 Liquid Glass(UIGlassEffect)로 렌더링되고
 * 캡슐 코너를 사용한다. 미만 버전은 기존 솔리드 배경 폴백.
 */
export function Button({
  title,
  onPress,
  variant = 'filled',
  size = 'large',
  disabled = false,
  loading = false,
  haptic = 'light',
  style,
}: ButtonProps) {
  const scheme = useColorScheme();
  const isDisabled = disabled || loading;
  const glass = isLiquidGlassAvailable() && variant !== 'plain';

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic === 'light') haptics.light();
    else if (haptic === 'medium') haptics.medium();
    else if (haptic === 'success') haptics.success();
    onPress();
  };

  const containerBase = size === 'large' ? styles.large : styles.medium;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        containerBase,
        glass && styles.capsule,
        !glass && variant === 'filled' && styles.filled,
        !glass && variant === 'tinted' && styles.tinted,
        !glass && variant === 'destructive' && styles.destructive,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {glass && (
        <GlassView
          pointerEvents="none"
          glassEffectStyle="regular"
          isInteractive
          tintColor={glassTint(variant, scheme === 'dark')}
          style={styles.glassFill}
        />
      )}
      {loading ? (
        <ActivityIndicator
          color={variant === 'filled' || variant === 'destructive' ? '#FFFFFF' : ios.tint}
        />
      ) : (
        <View style={styles.labelRow}>
          <Text style={[styles.label, labelColor(variant)]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

function glassTint(variant: ButtonVariant, dark: boolean): string | undefined {
  const hex = resolveIosHex(dark ? 'dark' : 'light');
  if (variant === 'filled') return hex.tint;
  if (variant === 'destructive') return hex.systemRed;
  return undefined; // tinted — 무틴트 regular 글래스
}

function labelColor(variant: ButtonVariant) {
  if (variant === 'filled') return styles.labelOnFilled;
  if (variant === 'destructive') return styles.labelDestructive;
  return styles.labelTinted;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: iosMetrics.radius.lg,
    overflow: 'hidden',
  },
  // iOS 26 글래스 버튼은 캡슐 코너
  capsule: { borderRadius: 999 },
  large: { minHeight: 50, paddingHorizontal: iosMetrics.spacing[5] },
  medium: { minHeight: iosMetrics.minTouchTarget, paddingHorizontal: iosMetrics.spacing[4] },
  filled: { backgroundColor: ios.tint },
  tinted: { backgroundColor: ios.tertiarySystemFill },
  destructive: { backgroundColor: ios.systemRed },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
  glassFill: { ...StyleSheet.absoluteFillObject, borderRadius: 999 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[2] },
  label: { ...iosType.headline },
  labelOnFilled: { color: '#FFFFFF' },
  labelDestructive: { color: '#FFFFFF' },
  labelTinted: { color: ios.tint },
});
