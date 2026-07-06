import Constants from 'expo-constants';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import WebView from 'react-native-webview';

import { ios, iosType } from '@/theme';

// 카카오맵 정적 지도 미리보기 (터치 비활성·고정 높이).
// 웹 apps/web/src/components/molecules/KakaoStaticMapPreview와 동일하게
// kakao.maps.StaticMap을 사용하되, 모바일은 WebView 안에서 렌더한다.
// 탭 동작(지도 화면 이동 등)은 부모가 Pressable로 감싸서 처리한다.

type Props = {
  lat: number;
  lng: number;
  /** 지도 확대 레벨 (기본 3). */
  level?: number;
  /** 고정 높이 (기본 160). */
  height?: number;
  style?: StyleProp<ViewStyle>;
};

function getKakaoMapKey(): string {
  return (
    (Constants.expoConfig?.extra as { kakaoMapKey?: string } | undefined)?.kakaoMapKey ?? ''
  );
}

// lat/lng/level은 숫자 검증 후 삽입하므로 HTML 인젝션 위험 없음.
function buildHtml(kakaoKey: string, lat: number, lng: number, level: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #map { width: 100%; height: 100%; overflow: hidden; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false"></script>
<script>
kakao.maps.load(function() {
  var center = new kakao.maps.LatLng(${lat}, ${lng});
  new kakao.maps.StaticMap(document.getElementById('map'), {
    center: center,
    level: ${level},
    marker: { position: center }
  });
});
</script>
</body>
</html>`;
}

export function KakaoStaticMapPreview({ lat, lng, level = 3, height = 160, style }: Props) {
  const kakaoKey = getKakaoMapKey();
  const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng);

  if (!kakaoKey || !hasValidCoords) {
    return (
      <View style={[styles.container, styles.fallback, { height }, style]}>
        <Text style={styles.fallbackText}>지도 미리보기를 불러올 수 없어요</Text>
      </View>
    );
  }

  return (
    // pointerEvents="none" — 미리보기 전용. WebView가 터치를 먹지 않아 부모 Pressable이 탭을 받는다.
    <View pointerEvents="none" style={[styles.container, { height }, style]}>
      <WebView
        style={styles.map}
        // baseUrl: SDK 내부 프로토콜 상대 리소스를 https로 해석(ATS) + 카카오 등록 도메인 리퍼러.
        // 주의: 카카오 콘솔에 localhost:3000 등록이 해제되면 지도가 빈 박스가 된다.
        source={{ html: buildHtml(kakaoKey, lat, lng, Math.trunc(level)), baseUrl: 'https://localhost:3000' }}
        javaScriptEnabled
        scrollEnabled={false}
        originWhitelist={['about:*', 'https://localhost*', 'https://*.kakao.com', 'http://*.kakao.com', 'https://*.kakaocdn.com']}
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  map: { flex: 1 },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ios.secondarySystemFill,
  },
  fallbackText: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
  },
});
