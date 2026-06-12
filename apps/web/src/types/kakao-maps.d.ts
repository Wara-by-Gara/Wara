export {};

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoLatLngBounds {
  extend: (latlng: KakaoLatLng) => void;
  isEmpty: () => boolean;
}

interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  setBounds: (
    bounds: KakaoLatLngBounds,
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number,
  ) => void;
  getLevel: () => number;
  getBounds: () => {
    getSouthWest: () => KakaoLatLng;
    getNorthEast: () => KakaoLatLng;
  };
}

interface KakaoMapsEventApi {
  addListener: (target: KakaoMap, type: string, handler: () => void) => void;
  removeListener: (target: KakaoMap, type: string, handler: () => void) => void;
}

interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (latlng: KakaoLatLng) => void;
}

interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (latlng: KakaoLatLng) => void;
}

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (
          container: HTMLElement,
          options: { center: KakaoLatLng; level: number },
        ) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        LatLngBounds: new () => KakaoLatLngBounds;
        Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker;
        CustomOverlay: new (options: {
          position: KakaoLatLng;
          content: HTMLElement;
          map?: KakaoMap;
          yAnchor?: number;
          xAnchor?: number;
          zIndex?: number;
        }) => KakaoCustomOverlay;
        StaticMap: new (
          container: HTMLElement,
          options: {
            center: KakaoLatLng;
            level: number;
            marker?: { position: KakaoLatLng };
          },
        ) => object;
        event: KakaoMapsEventApi;
      };
    };
  }
}
