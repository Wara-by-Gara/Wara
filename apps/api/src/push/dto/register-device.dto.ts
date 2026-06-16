import { z } from 'zod';
import { Expo } from 'expo-server-sdk';
import { DEVICE_PLATFORMS } from '../push.types';

// mobile(Expo)에서 발급한 Expo Push Token 등록.
// 형식(ExponentPushToken[...]) 검증은 Expo.isExpoPushToken으로 위임.
export const RegisterDeviceSchema = z.object({
  token: z.string().refine((v) => Expo.isExpoPushToken(v), {
    message: 'INVALID_EXPO_PUSH_TOKEN',
  }),
  platform: z.enum(DEVICE_PLATFORMS),
  deviceId: z.string().min(1).max(255).optional(),
  deviceName: z.string().min(1).max(255).optional(),
  appVersion: z.string().min(1).max(64).optional(),
});

export type RegisterDeviceDto = z.infer<typeof RegisterDeviceSchema>;

export const UnregisterDeviceSchema = z.object({
  token: z.string().min(1),
});

export type UnregisterDeviceDto = z.infer<typeof UnregisterDeviceSchema>;
