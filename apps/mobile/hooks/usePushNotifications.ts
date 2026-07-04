// 목적: Expo 푸시 알림 라이프사이클 훅 (iOS 전용 앱).
//  1) 로그인 상태에서 알림 권한 요청 → Expo 푸시 토큰 획득 → 서버 등록(api/push)
//  2) foreground 수신 시 배너 표시(setNotificationHandler)
//  3) 알림 탭(response) → payload로 초대장 딥링크(expo-router)
// 미로그인(토큰 없음) 상태에서는 등록을 시도하지 않는다.
// 라우팅 규칙은 app/(tabs)/notifications.tsx의 hrefFor와 동일하게 유지한다.
import Constants from 'expo-constants';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';

import { getAccessToken } from '@/api';
import { registerPushToken } from '@/api/push';

// foreground(앱 사용 중) 수신 시 배너/사운드 표시. 모듈 로드 시 1회 등록.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * 푸시 payload(data) → 앱 내 딥링크. 라우팅 불가면 null (notifications.tsx hrefFor와 동일 규칙).
 *
 * 서버(apps/api push.service.ts)는 Expo 메시지 data에 딥링크를 `url`(상대 경로)로 담아 보낸다.
 * 따라서 `url`을 우선 사용하되, 미구현 라우트(예: /chats/:id) 진입을 막기 위해
 * notifications.tsx hrefFor와 동일하게 초대장 상세(/invitations/:id)만 허용한다.
 * `url`이 없을 경우를 대비해 targetType/targetId/invitationId 필드도 폴백으로 처리한다.
 */
function hrefFromData(data: Record<string, unknown> | undefined): Href | null {
  if (!data) return null;

  // 1) 서버가 보내는 상대 경로 url — 초대장 상세만 허용.
  const url = typeof data.url === 'string' ? data.url : null;
  if (url && /^\/invitations\/[^/]+$/.test(url)) {
    return url as Href;
  }

  // 2) 폴백: 개별 필드 기반 (in-app 알림과 동일 규칙).
  const targetType = typeof data.targetType === 'string' ? data.targetType : null;
  const targetId = typeof data.targetId === 'string' ? data.targetId : null;
  const invitationId = typeof data.invitationId === 'string' ? data.invitationId : null;

  if (targetType === 'invitation' && targetId) {
    return `/invitations/${targetId}` as Href;
  }
  if (
    invitationId &&
    (targetType === 'feedback' || targetType === 'photo' || targetType === 'mission')
  ) {
    return `/invitations/${invitationId}` as Href;
  }
  // conversation(DM)·투표 상세 등 미구현 라우트는 무시.
  return null;
}

/** EAS projectId — getExpoPushTokenAsync에 필요. app config(extra.eas / easConfig)에서 해석. */
function resolveProjectId(): string | undefined {
  const fromExtra = (
    Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
  )?.eas?.projectId;
  return fromExtra ?? Constants.easConfig?.projectId;
}

export function usePushNotifications(): void {
  const router = useRouter();

  // 1) 권한 요청 + 토큰 등록 (로그인 상태에서만).
  useEffect(() => {
    let cancelled = false;

    async function register(): Promise<void> {
      const auth = await getAccessToken();
      if (cancelled || !auth) return;

      const current = await Notifications.getPermissionsAsync();
      let granted = current.granted;
      if (!granted && current.canAskAgain) {
        const requested = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        granted = requested.granted;
      }
      if (cancelled || !granted) return;

      try {
        const projectId = resolveProjectId();
        const token = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (cancelled) return;
        await registerPushToken(token.data);
      } catch {
        // 시뮬레이터·네트워크 오류 등으로 토큰 획득/등록 실패 — 조용히 무시(다음 실행에서 재시도).
      }
    }

    void register();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) 알림 탭 → 딥링크 (foreground/background 응답 + 콜드 스타트).
  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const href = hrefFromData(response.notification.request.content.data);
      if (href) router.push(href);
    });

    // 앱이 종료된 상태에서 알림 탭으로 실행된 경우.
    let cancelled = false;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (cancelled || !response) return;
      const href = hrefFromData(response.notification.request.content.data);
      if (href) router.push(href);
    });

    return () => {
      cancelled = true;
      responseSub.remove();
    };
  }, [router]);
}
