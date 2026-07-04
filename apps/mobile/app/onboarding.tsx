// 가입 직후 온보딩 — 권한 안내 3스텝 (알림/사진/위치). 웹 /onboarding IA·카피 미러.
// 웹과 달리 재방문 가드 불필요: signup 완료 동선에서만 진입한다.
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useMutation } from '@tanstack/react-query';
import type { SymbolViewProps } from 'expo-symbols';

import { Button, haptics } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import { updateNotificationSettings, type UpdateNotificationSettingsPayload } from '@/api/reminders';

type Step = 'notification' | 'photo' | 'location' | 'denied';

const NOTIFICATION_OFF: UpdateNotificationSettingsPayload = {
  isRemind: false,
  isFeedback: false,
  isInvitationDate: false,
};
const PHOTO_OFF: UpdateNotificationSettingsPayload = { isPhoto: false, isMission: false };
const LOCATION_OFF: UpdateNotificationSettingsPayload = {
  isParticipantLocations: false,
  isEventLocations: false,
};

const GUIDES: Record<Step, { icon: SymbolViewProps['name']; title: string; description: string }> = {
  notification: {
    icon: 'bell.fill',
    title: '알림을 보내드려도 될까요?',
    description: 'RSVP 응답이나 모임 안내를 알려드릴게요',
  },
  photo: {
    icon: 'photo.on.rectangle.angled',
    title: '사진을 함께 모으려면\n앨범 접근이 필요해요',
    description: '모임 사진을 선택해 Wara 앨범에 올릴 수 있어요',
  },
  location: {
    icon: 'mappin.and.ellipse',
    title: '장소를 빠르게 찾으려면\n위치가 필요해요',
    description: '초대장의 장소를 지도로 보여드릴게요',
  },
  denied: {
    icon: 'lock.fill',
    title: '권한이 거부되었어요',
    description: '설정 > 알림에서 다시 허용할 수 있어요',
  },
};

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('notification');
  const { mutate: patchSettings } = useMutation({ mutationFn: updateNotificationSettings });

  const complete = () => router.replace('/(tabs)');

  const handleSkip = () => {
    Alert.alert('건너뛰시겠어요?', '언제든 설정에서 다시 허용할 수 있어요', [
      { text: '계속하기', style: 'cancel' },
      {
        text: 'Skip',
        style: 'destructive',
        onPress: () => {
          patchSettings(NOTIFICATION_OFF);
          patchSettings(PHOTO_OFF);
          patchSettings(LOCATION_OFF);
          complete();
        },
      },
    ]);
  };

  const handleDeny = () => {
    haptics.light();
    if (step === 'notification') {
      patchSettings(NOTIFICATION_OFF);
      setStep('photo');
    } else if (step === 'photo') {
      patchSettings(PHOTO_OFF);
      setStep('location');
    } else if (step === 'location') {
      patchSettings(LOCATION_OFF);
      complete();
    } else {
      complete();
    }
  };

  const handleAllow = async () => {
    haptics.light();
    if (step === 'notification') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'denied') {
        patchSettings(NOTIFICATION_OFF);
        setStep('denied');
        return;
      }
      setStep('photo');
    } else if (step === 'photo') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') patchSettings(PHOTO_OFF);
      setStep('location');
    } else if (step === 'location') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') patchSettings(LOCATION_OFF);
      complete();
    } else {
      // denied 스텝의 "설정 열기"
      Linking.openSettings();
      complete();
    }
  };

  const guide = GUIDES[step];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Button title="Skip" variant="plain" size="medium" haptic={null} onPress={handleSkip} />
      </View>

      <View style={styles.body}>
        <View style={styles.iconBadge}>
          <IconSymbol name={guide.icon} size={40} color={ios.tint} />
        </View>
        <Text style={styles.title}>{guide.title}</Text>
        <Text style={styles.description}>{guide.description}</Text>
      </View>

      <View style={styles.footer}>
        <Button
          title={step === 'denied' ? '설정 열기' : '권한 허용하기'}
          onPress={() => {
            void handleAllow();
          }}
        />
        <Button title="나중에 할게요" variant="plain" onPress={handleDeny} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ios.systemBackground,
    paddingTop: iosMetrics.spacing[16],
  },
  header: { alignItems: 'flex-end', paddingHorizontal: iosMetrics.spacing[4] },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.spacing[8],
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: iosMetrics.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ios.tertiarySystemFill,
    marginBottom: iosMetrics.spacing[3],
  },
  title: { ...iosType.title2, color: ios.label, textAlign: 'center' },
  description: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },
  footer: {
    gap: iosMetrics.spacing[2],
    paddingHorizontal: iosMetrics.spacing[5],
    paddingBottom: iosMetrics.spacing[10],
  },
});
