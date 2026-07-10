import type { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import type { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

/**
 * SF Symbols 아이콘 (iOS 전용). `expo-symbols`의 `SymbolView` 래퍼.
 * `color`는 hex 문자열 또는 `PlatformColor`(OpaqueColorValue) 모두 허용.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
  type = 'monochrome',
  animationSpec,
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
  type?: SymbolViewProps['type'];
  animationSpec?: SymbolViewProps['animationSpec'];
}) {
  return (
    <SymbolView
      name={name}
      weight={weight}
      type={type}
      animationSpec={animationSpec}
      tintColor={color as string}
      resizeMode="scaleAspectFit"
      style={[{ width: size, height: size }, style]}
    />
  );
}
