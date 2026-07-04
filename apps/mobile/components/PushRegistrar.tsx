// 목적: 로그인된(인증) 영역에서 마운트되어 Expo 푸시 토큰 등록/딥링크 리스너를 활성화한다.
// UI는 렌더하지 않는다. usePushNotifications 훅의 라이프사이클만 구동한다.
// (마운트 위치는 app/_layout.tsx의 인증 영역 — 메인이 처리.)
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushRegistrar(): null {
  usePushNotifications();
  return null;
}
