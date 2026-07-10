/**
 * iOS 네이티브 디자인 토큰 — 앱 크롬 SoT.
 *
 * 사용:
 *   import { ios, iosType, iosMetrics } from '@/theme';
 *   const styles = StyleSheet.create({
 *     screen: { backgroundColor: ios.systemGroupedBackground },
 *     title: { color: ios.label, ...iosType.largeTitle },
 *     card: { borderRadius: iosMetrics.radius.lg, padding: iosMetrics.spacing[4] },
 *   });
 *
 * 초대장 콘텐츠/캔버스는 이 크롬 토큰이 아니라 초대장 자체의 시각 정체성을 사용한다.
 */

export { ios, iosHex, resolveIosHex, type IosHexToken } from './ios-colors';
export { iosType, type IosTypeToken } from './ios-typography';
export { iosMetrics, iosSpacing, iosRadius } from './ios-metrics';
