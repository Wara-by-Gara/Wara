import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import { colors, typography } from '@/constants/tokens';

export type ParticipantPin = {
  participantId: string;
  lat: number;
  lng: number;
  nickname: string | null;
  profileImageUrl: string | null;
  isArrived: boolean;
};

export type MapEventLocation = {
  lat: number;
  lng: number;
  placeName: string;
};

type Props = {
  eventLocation?: MapEventLocation;
  participants?: ParticipantPin[];
  myLocation?: { lat: number; lng: number };
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

function buildHtml(kakaoKey: string, eventLocation?: MapEventLocation): string {
  const evtJson = eventLocation ? safeJson(eventLocation) : 'null';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #map { width: 100%; height: 100%; overflow: hidden; }
.p-wrap { position: relative; display: flex; flex-direction: column; align-items: center; }
.p-img {
  width: 40px; height: 40px; border-radius: 50%;
  border: 2.5px solid #ff4fa3; object-fit: cover;
  background: #ffe1ef; display: flex; align-items: center;
  justify-content: center; font-size: 14px; font-weight: 700; color: #ff4fa3;
  overflow: hidden;
}
.p-img.arrived { border-color: #22c55e; }
.p-label {
  margin-top: 4px; background: #ff4fa3; color: #fff;
  font-size: 11px; padding: 2px 7px; border-radius: 8px;
  white-space: nowrap; font-family: sans-serif;
}
.p-label.arrived { background: #22c55e; }
.my-dot {
  width: 14px; height: 14px; border-radius: 50%;
  background: #2ea8f5; border: 2.5px solid #fff;
  box-shadow: 0 0 0 4px rgba(46,168,245,0.25);
}
.ev-wrap { display: flex; flex-direction: column; align-items: center; }
.ev-icon { font-size: 28px; line-height: 1; }
.ev-label {
  margin-top: 4px; background: #fff; border: 1.5px solid #ff4fa3;
  border-radius: 8px; padding: 3px 8px; font-size: 12px; font-weight: 600;
  color: #ff4fa3; white-space: nowrap; font-family: sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false"></script>
<script>
var map = null;
var participants = {};
var myMarker = null;
var eventMarker = null;
var eventLocation = ${evtJson};
var mapReady = false;

kakao.maps.load(function() {
  var center = eventLocation
    ? new kakao.maps.LatLng(eventLocation.lat, eventLocation.lng)
    : new kakao.maps.LatLng(37.5665, 126.9780);

  map = new kakao.maps.Map(document.getElementById('map'), {
    center: center,
    level: 4
  });

  if (eventLocation) {
    var el = document.createElement('div');
    el.className = 'ev-wrap';
    el.innerHTML = '<div class="ev-icon">📍</div>'
      + '<div class="ev-label">' + escHtml(eventLocation.placeName) + '</div>';
    eventMarker = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(eventLocation.lat, eventLocation.lng),
      content: el,
      yAnchor: 1.1,
      zIndex: 10
    });
    eventMarker.setMap(map);
  }

  mapReady = true;
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage('ready');
  }
});

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateParticipants(data) {
  if (!map) return;
  data.forEach(function(p) {
    var label = p.isArrived ? '도착' : (p.nickname || '?');
    var imgContent = p.profileImageUrl
      ? '<img class="p-img' + (p.isArrived ? ' arrived' : '') + '" src="' + p.profileImageUrl + '" />'
      : '<div class="p-img' + (p.isArrived ? ' arrived' : '') + '">'
        + escHtml((p.nickname || '?').charAt(0)) + '</div>';

    var el = document.createElement('div');
    el.className = 'p-wrap';
    el.innerHTML = imgContent
      + '<div class="p-label' + (p.isArrived ? ' arrived' : '') + '">'
      + escHtml(label) + '</div>';

    var pos = new kakao.maps.LatLng(p.lat, p.lng);
    if (participants[p.participantId]) {
      participants[p.participantId].setPosition(pos);
      participants[p.participantId].setContent(el);
    } else {
      var overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: el,
        yAnchor: 1.5,
        zIndex: 5
      });
      overlay.setMap(map);
      participants[p.participantId] = overlay;
    }
  });
  fitBounds();
}

function updateMyLocation(lat, lng) {
  if (!map) return;
  var pos = new kakao.maps.LatLng(lat, lng);
  if (myMarker) {
    myMarker.setPosition(pos);
  } else {
    var el = document.createElement('div');
    el.className = 'my-dot';
    myMarker = new kakao.maps.CustomOverlay({
      position: pos,
      content: el,
      yAnchor: 0.5,
      xAnchor: 0.5,
      zIndex: 20
    });
    myMarker.setMap(map);
  }
}

function fitBounds() {
  if (!map) return;
  var bounds = new kakao.maps.LatLngBounds();
  var count = 0;
  if (eventLocation) {
    bounds.extend(new kakao.maps.LatLng(eventLocation.lat, eventLocation.lng));
    count++;
  }
  Object.keys(participants).forEach(function(id) {
    bounds.extend(participants[id].getPosition());
    count++;
  });
  if (count > 0) map.setBounds(bounds, 80, 80, 80, 80);
}
</script>
</body>
</html>`;
}

export default function KakaoMapView({ eventLocation, participants, myLocation }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const pendingParticipantsRef = useRef<ParticipantPin[] | null>(null);
  const pendingMyLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const kakaoKey = getKakaoMapKey();
  const html = buildHtml(kakaoKey, eventLocation);

  function injectJs(js: string) {
    webViewRef.current?.injectJavaScript(`(function(){ ${js} })(); true;`);
  }

  function handleMessage(e: { nativeEvent: { data: string } }) {
    if (e.nativeEvent.data === 'ready') {
      setMapReady(true);
      if (pendingParticipantsRef.current) {
        injectJs(`updateParticipants(${safeJson(pendingParticipantsRef.current)});`);
        pendingParticipantsRef.current = null;
      }
      if (pendingMyLocationRef.current) {
        const { lat, lng } = pendingMyLocationRef.current;
        injectJs(`updateMyLocation(${lat}, ${lng});`);
        pendingMyLocationRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (!participants) return;
    if (!mapReady) {
      pendingParticipantsRef.current = participants;
      return;
    }
    injectJs(`updateParticipants(${safeJson(participants)});`);
  }, [participants, mapReady]);

  useEffect(() => {
    if (!myLocation) return;
    if (!mapReady) {
      pendingMyLocationRef.current = myLocation;
      return;
    }
    injectJs(`updateMyLocation(${myLocation.lat}, ${myLocation.lng});`);
  }, [myLocation, mapReady]);

  // env 누락 시 SDK가 빈 키로 로드돼 빈 지도 + 알 수 없는 실패. 명시적 안내.
  if (!kakaoKey) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>지도를 불러올 수 없어요</Text>
        <Text style={styles.fallbackMsg}>
          EXPO_PUBLIC_KAKAO_MAP_APP_KEY 환경변수가 설정되지 않았습니다.
        </Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      style={styles.map}
      // baseUrl: 카카오 JS 키 도메인 검증 + SDK 내부 리소스를 https로 로드 (ATS 차단 회피)
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
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: colors.surface,
  },
  fallbackTitle: {
    ...typography.title2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fallbackMsg: {
    ...typography.body3,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
