// 백엔드가 심어주는 is_logged_in 평문 마커 쿠키를 읽기 위한 단일 헬퍼.
// authStore.hydrate / useMe / 기타 가드에서 동일한 검출 로직을 쓰도록 통합.
//
// 마커 값은 "1"만 의미가 있으며, document.cookie는 동일 이름이 여러 번 등장하지 않는다는 사실에 의존한다.

const IS_LOGGED_IN_COOKIE = 'is_logged_in';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const target = `${name}=`;
  for (const row of document.cookie.split('; ')) {
    if (row.startsWith(target)) return row.slice(target.length);
  }
  return null;
}

export function isLoggedInCookieSet(): boolean {
  return readCookie(IS_LOGGED_IN_COOKIE) === '1';
}
