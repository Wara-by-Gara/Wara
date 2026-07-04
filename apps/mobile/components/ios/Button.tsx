import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { ios, iosMetrics, iosType } from '@/theme';
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
  const isDisabled = disabled || loading;

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
        variant === 'filled' && styles.filled,
        variant === 'tinted' && styles.tinted,
        variant === 'destructive' && styles.destructive,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'filled' || variant === 'destructive' ? '#FFFFFF' : ios.tint} />
      ) : (
        <View style={styles.labelRow}>
          <Text style={[styles.label, labelColor(variant)]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
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
  },
  large: { minHeight: 50, paddingHorizontal: iosMetrics.spacing[5] },
  medium: { minHeight: iosMetrics.minTouchTarget, paddingHorizontal: iosMetrics.spacing[4] },
  filled: { backgroundColor: ios.tint },
  tinted: { backgroundColor: ios.tertiarySystemFill },
  destructive: { backgroundColor: ios.systemRed },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[2] },
  label: { ...iosType.headline },
  labelOnFilled: { color: '#FFFFFF' },
  labelDestructive: { color: '#FFFFFF' },
  labelTinted: { color: ios.tint },
});
