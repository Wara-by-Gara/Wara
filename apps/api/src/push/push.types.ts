// 네이티브 푸시 기기 플랫폼 — DB enum(device_platform)과 일치.
export const DEVICE_PLATFORMS = ['ios', 'android'] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];
