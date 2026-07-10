import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

export interface PhotoMapMarker {
  id: string;
  lat: number;
  lng: number;
  url: string;
  count: number;
}

type Props = {
  markers?: PhotoMapMarker[];
  onMarkerClick?: (markerId: string) => void;
};

function getKakaoMapKey(): string {
  return (
    (Constants.expoConfig?.extra as { kakaoMapKey?: string } | undefined)?.kakaoMapKey ?? ''
  );
}

// <, >, &, ' → 유니코드 이스케이프. HTML <script> 블록과 injectJavaScript 양쪽에서 안전.
function safeJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

function buildHtml(kakaoKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #map { width: 100%; height: 100%; overflow: hidden; }
.pm-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.pm-img {
  width: 52px; height: 52px;
  object-fit: cover;
  border-radius: 10px;
  border: 2.5px solid #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.25);
  display: block;
}
.pm-tail {
  width: 0; height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 7px solid #fff;
  margin-top: -1px;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.12));
}
.pm-badge {
  position: absolute;
  top: -6px; right: -6px;
  background: #ff4fa3;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  font-family: sans-serif;
}
</style>
</head>
<body>
<div id="map"></div>
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false"></script>
<script>
var map = null;
var markers = {};

kakao.maps.load(function() {
  map = new kakao.maps.Map(document.getElementById('map'), {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 7
  });
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
  }
});

function updatePhotoMarkers(data) {
  if (!map) return;
  var incoming = {};
  data.forEach(function(m) { incoming[m.id] = true; });

  // 사라진 마커 제거
  Object.keys(markers).forEach(function(id) {
    if (!incoming[id]) {
      markers[id].setMap(null);
      delete markers[id];
    }
  });

  // 추가/갱신
  data.forEach(function(m) {
    if (markers[m.id]) {
      markers[m.id].setPosition(new kakao.maps.LatLng(m.lat, m.lng));
      return;
    }

    var el = document.createElement('div');
    el.className = 'pm-wrap';

    var img = document.createElement('img');
    img.className = 'pm-img';
    img.src = m.url;

    var tail = document.createElement('div');
    tail.className = 'pm-tail';

    el.appendChild(img);
    el.appendChild(tail);

    if (m.count > 1) {
      var badge = document.createElement('div');
      badge.className = 'pm-badge';
      badge.textContent = String(m.count);
      el.appendChild(badge);
    }

    (function(id) {
      el.addEventListener('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'photoClick', markerId: id }));
        }
      });
    })(m.id);

    var overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(m.lat, m.lng),
      content: el,
      yAnchor: 1.35,
      zIndex: 8
    });
    overlay.setMap(map);
    markers[m.id] = overlay;
  });

  fitBounds(data);
}

function fitBounds(data) {
  if (!map || data.length === 0) return;
  var bounds = new kakao.maps.LatLngBounds();
  data.forEach(function(m) {
    bounds.extend(new kakao.maps.LatLng(m.lat, m.lng));
  });
  map.setBounds(bounds, 80, 80, 80, 80);
}
</script>
</body>
</html>`;
}

export default function PhotoKakaoMapView({ markers, onMarkerClick }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const pendingMarkersRef = useRef<PhotoMapMarker[] | null>(null);

  const html = buildHtml(getKakaoMapKey());

  function injectJs(js: string) {
    webViewRef.current?.injectJavaScript(`(function(){ ${js} })(); true;`);
  }

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type: string; markerId?: string };
      if (msg.type === 'ready') {
        setMapReady(true);
        if (pendingMarkersRef.current) {
          injectJs(`updatePhotoMarkers(${safeJson(pendingMarkersRef.current)});`);
          pendingMarkersRef.current = null;
        }
      } else if (msg.type === 'photoClick' && msg.markerId) {
        onMarkerClick?.(msg.markerId);
      }
    } catch {
      // ignore malformed messages
    }
  }

  useEffect(() => {
    if (!markers) return;
    if (!mapReady) {
      pendingMarkersRef.current = markers;
      return;
    }
    injectJs(`updatePhotoMarkers(${safeJson(markers)});`);
  }, [markers, mapReady]);

  return (
    <WebView
      ref={webViewRef}
      style={styles.map}
      // baseUrl: SDK 내부 리소스 https 해석(ATS) + 카카오 등록 도메인 리퍼러
      source={{ html, baseUrl: 'https://localhost:3000' }}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['about:*', 'https://localhost*', 'https://*.kakao.com', 'http://*.kakao.com', 'https://*.kakaocdn.com']}
      mixedContentMode="always"
      onMessage={handleMessage}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
