"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { updateNotificationSettings } from "@/lib/api/notifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { Onboarding, type OnboardingStep } from "./Onboarding";

const NOTIFICATION_PERMISSION_OFF = {
  isRemind: false,
  isFeedback: false,
  isInvitationDate: false,
};

const PHOTO_PERMISSION_OFF = {
  isPhoto: false,
  isMission: false,
};

const LOCATION_PERMISSION_OFF = {
  isParticipantLocations: false,
  isEventLocations: false,
};

const ONBOARDING_KEY = "wara_onboarding_done";

export function OnboardingContainer() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("permissionNotification");
  const { enable: enablePush } = usePushSubscription();
  const { mutate: disableNotifications } = useMutation({
    mutationFn: () => updateNotificationSettings(NOTIFICATION_PERMISSION_OFF),
  });
  const { mutate: disablePhotoNotifications } = useMutation({
    mutationFn: () => updateNotificationSettings(PHOTO_PERMISSION_OFF),
  });
  const { mutate: disableLocationNotifications } = useMutation({
    mutationFn: () => updateNotificationSettings(LOCATION_PERMISSION_OFF),
  });

  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_KEY)) {
      router.replace("/");
    }
  }, [router]);

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setStep("completedRedirect");
    setTimeout(() => router.replace("/"), 1500);
  };

  const handleSkip = () => {
    disableNotifications();
    disablePhotoNotifications();
    disableLocationNotifications();
    complete();
  };

  const handleDeny = () => {
    if (step === "permissionNotification") {
      disableNotifications();
      setStep("permissionPhoto");
    } else if (step === "permissionPhoto") {
      disablePhotoNotifications();
      setStep("permissionLocation");
    } else if (step === "permissionLocation") {
      disableLocationNotifications();
      complete();
    } else {
      complete();
    }
  };

  const handleOpenSettings = () => complete();

  const handleAllow = async () => {
    if (step === "permissionNotification") {
      if (typeof Notification !== "undefined") {
        const result = await Notification.requestPermission();
        if (result === "denied") {
          disableNotifications();
          setStep("permissionDenied");
          return;
        }
        // 허용됨 → 백그라운드 푸시 구독 생성 (PC·Android, iOS는 내부에서 skip)
        if (result === "granted") void enablePush();
      }
      setStep("permissionPhoto");
    } else if (step === "permissionPhoto") {
      setStep("permissionLocation");
    } else if (step === "permissionLocation") {
      await new Promise<void>((resolve) => {
        if (!navigator.geolocation) {
          disableLocationNotifications();
          resolve();
          return;
        }
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          () => {
            disableLocationNotifications();
            resolve();
          },
        );
      });
      complete();
    } else if (step === "permissionDenied") {
      complete();
    }
  };

  return (
    <Onboarding
      step={step}
      onSkip={handleSkip}
      onAllow={handleAllow}
      onDeny={handleDeny}
      onOpenSettings={handleOpenSettings}
    />
  );
}
