"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/cn";

interface SdkKakaoMap {
  setCenter: (latlng: { getLat: () => number; getLng: () => number }) => void;
  setBounds: (
    bounds: { extend: (latlng: { getLat: () => number; getLng: () => number }) => void; isEmpty: () => boolean },
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number,
  ) => void;
  getLevel: () => number;
  getBounds: () => {
    getSouthWest: () => { getLat: () => number; getLng: () => number };
    getNorthEast: () => { getLat: () => number; getLng: () => number };
  };
}

export interface MapBbox {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

interface SdkKakaoCustomOverlay {
  setMap: (map: SdkKakaoMap | null) => void;
  setPosition: (latlng: { getLat: () => number; getLng: () => number }) => void;
}

export interface ParticipantPin {
  participantId: string;
  lat: number;
  lng: number;
  profileImageUrl: string | null;
  nickname: string | null;
  isArrived: boolean;
}

export interface KakaoMapHandle {
  centerOn: (lat: number, lng: number) => void;
}

export interface PhotoMarker {
  id: string;
  lat: number;
  lng: number;
  url: string;
  count: number;
}

export interface KakaoMapProps {
  ready?: boolean;
  eventLocation?: {
    lat: number;
    lng: number;
    placeName: string;
  };
  participants?: ParticipantPin[];
  className?: string;
  /** 내 현재 위치 — 파란 테두리 프로필 마커 */
  myLocation?: {
    lat: number;
    lng: number;
    profileImageUrl?: string | null;
    nickname?: string | null;
  };
  /** 사진 위치 핀 목록 */
  photoMarkers?: PhotoMarker[];
  /** 사진 핀 클릭 콜백 — markerId는 클러스터 대표 사진 ID */
  onPhotoMarkerClick?: (markerId: string) => void;
  /** 호스트: 참가자 핀 탭 */
  onParticipantClick?: (pin: ParticipantPin) => void;
  /**
   * 마커 변경 시 자동 fitBounds 정책.
   * - "always": 매 변경마다 fit (기존 동작, default)
   * - "first": 첫 마커 셋이 도착했을 때 1회만 fit (사용자 줌·팬 보존)
   * - "never": 자동 fit 안 함
   */
  autoFit?: "always" | "first" | "never";
  /** map의 보이는 영역이 바뀔 때마다 호출 (idle 이벤트 기반) */
  onBoundsChange?: (bbox: MapBbox) => void;
  /** 초기 중심 좌표 — eventLocation이 없을 때 사용. default 서울 시청 */
  initialCenter?: { lat: number; lng: number };
  /** 초기 줌 레벨. default 4 */
  initialLevel?: number;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울 시청

function createParticipantOverlayContent(
  pin: ParticipantPin,
  onClick?: (pin: ParticipantPin) => void,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: ${onClick ? "pointer" : "default"};
  `;
  wrapper.setAttribute("data-testid", "participant-pin");
  wrapper.setAttribute("data-participant-id", pin.participantId);
  if (onClick) {
    wrapper.addEventListener("click", () => onClick(pin));
  }

  const bubble = document.createElement("div");
  bubble.style.cssText = `
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid ${pin.isArrived ? "#22c55e" : "#ff4fa3"};
    overflow: hidden;
    background: #f5f5f5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    flex-shrink: 0;
  `;

  if (pin.profileImageUrl) {
    const img = document.createElement("img");
    img.src = pin.profileImageUrl;
    img.alt = pin.nickname ?? "";
    img.style.cssText = "width: 100%; height: 100%; object-fit: cover;";
    bubble.appendChild(img);
  } else {
    const initials = document.createElement("div");
    initials.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
      color: #737373;
    `;
    initials.textContent = (pin.nickname ?? "?").charAt(0).toUpperCase();
    bubble.appendChild(initials);
  }

  const label = document.createElement("div");
  label.style.cssText = `
    background: rgba(0,0,0,0.65);
    color: white;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 999px;
    white-space: nowrap;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
  label.textContent = pin.isArrived ? "도착" : (pin.nickname ?? "");

  // tail
  const tail = document.createElement("div");
  tail.style.cssText = `
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid ${pin.isArrived ? "#22c55e" : "#ff4fa3"};
    margin-top: -2px;
  `;

  wrapper.appendChild(bubble);
  wrapper.appendChild(tail);
  wrapper.appendChild(label);
  return wrapper;
}

function createEventMarkerContent(placeName: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  `;

  const pin = document.createElement("div");
  pin.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #ff4fa3;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(255,79,163,0.4);
    border: 2px solid white;
  `;
  pin.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

  const label = document.createElement("div");
  label.style.cssText = `
    background: #ff4fa3;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    white-space: nowrap;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  `;
  label.textContent = placeName;

  wrapper.appendChild(pin);
  wrapper.appendChild(label);
  return wrapper;
}

// 본인 위치 마커 — 참여자 핀과 같은 구조, 테두리만 파랑(#3b82f6).
function createMyLocationOverlayContent(
  profileImageUrl: string | null,
  nickname: string | null,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  `;
  wrapper.setAttribute("data-testid", "my-location-pin");

  const bubble = document.createElement("div");
  bubble.style.cssText = `
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid #3b82f6;
    overflow: hidden;
    background: #f5f5f5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    flex-shrink: 0;
  `;

  if (profileImageUrl) {
    const img = document.createElement("img");
    img.src = profileImageUrl;
    img.alt = nickname ?? "";
    img.style.cssText = "width: 100%; height: 100%; object-fit: cover;";
    bubble.appendChild(img);
  } else {
    const initials = document.createElement("div");
    initials.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
      color: #737373;
    `;
    initials.textContent = (nickname ?? "나").charAt(0).toUpperCase();
    bubble.appendChild(initials);
  }

  const tail = document.createElement("div");
  tail.style.cssText = `
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid #3b82f6;
    margin-top: -2px;
  `;

  const label = document.createElement("div");
  label.style.cssText = `
    background: #3b82f6;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 999px;
    white-space: nowrap;
  `;
  label.textContent = "나";

  wrapper.appendChild(bubble);
  wrapper.appendChild(tail);
  wrapper.appendChild(label);
  return wrapper;
}

function createPhotoMarkerContent(url: string, count: number, onClick: () => void): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
  `;

  const img = document.createElement("img");
  img.src = url;
  img.alt = "";
  img.style.cssText = `
    width: 52px;
    height: 52px;
    object-fit: cover;
    border-radius: 10px;
    border: 2.5px solid white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.25);
    display: block;
  `;

  const tail = document.createElement("div");
  tail.style.cssText = `
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 7px solid white;
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));
    margin-top: -1px;
  `;

  wrapper.appendChild(img);
  wrapper.appendChild(tail);

  if (count > 1) {
    const badge = document.createElement("div");
    badge.style.cssText = `
      position: absolute;
      top: -6px;
      right: -6px;
      background: #ff4fa3;
      color: white;
      font-size: 11px;
      font-weight: 700;
      min-width: 20px;
      height: 20px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    `;
    badge.textContent = String(count);
    wrapper.appendChild(badge);
  }

  wrapper.addEventListener("click", onClick);
  return wrapper;
}

export const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  {
    ready,
    eventLocation,
    participants = [],
    className,
    myLocation,
    photoMarkers = [],
    onPhotoMarkerClick,
    onParticipantClick,
    autoFit = "always",
    onBoundsChange,
    initialCenter,
    initialLevel = 4,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SdkKakaoMap | null>(null);
  const eventOverlayRef = useRef<SdkKakaoCustomOverlay | null>(null);
  const participantOverlaysRef = useRef<Map<string, SdkKakaoCustomOverlay>>(new Map());
  const myLocationOverlayRef = useRef<SdkKakaoCustomOverlay | null>(null);
  const photoOverlaysRef = useRef<Map<string, SdkKakaoCustomOverlay>>(new Map());
  const initializedRef = useRef(false);
  const firstFitDoneRef = useRef(false);

  useImperativeHandle(ref, () => ({
    centerOn(lat: number, lng: number) {
      if (!mapRef.current || !window.kakao?.maps) return;
      const pos = new window.kakao.maps.LatLng(lat, lng);
      mapRef.current.setCenter(pos);
    },
  }));

  // Map 초기화
  useEffect(() => {
    if (!ready || !containerRef.current || initializedRef.current) return;

    const kakao = window.kakao;
    if (!kakao?.maps) return;

    const initMap = () => {
      if (!containerRef.current || !kakao.maps) return;
      const { maps } = kakao;
      const center = new maps.LatLng(
        eventLocation?.lat ?? initialCenter?.lat ?? DEFAULT_CENTER.lat,
        eventLocation?.lng ?? initialCenter?.lng ?? DEFAULT_CENTER.lng,
      );
      const map = new maps.Map(containerRef.current, { center, level: initialLevel });
      mapRef.current = map;
      initializedRef.current = true;

      if (onBoundsChange) {
        const emitBounds = () => {
          const b = map.getBounds();
          const sw = b.getSouthWest();
          const ne = b.getNorthEast();
          onBoundsChange({
            swLat: sw.getLat(),
            swLng: sw.getLng(),
            neLat: ne.getLat(),
            neLng: ne.getLng(),
          });
        };
        emitBounds();
        maps.event.addListener(map, "idle", emitBounds);
      }
    };

    kakao.maps.load(initMap);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // 행사 장소 마커 갱신
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const { maps } = window.kakao;

    if (eventOverlayRef.current) {
      eventOverlayRef.current.setMap(null);
      eventOverlayRef.current = null;
    }

    if (!eventLocation) return;

    const pos = new maps.LatLng(eventLocation.lat, eventLocation.lng);
    const overlay = new maps.CustomOverlay({
      position: pos,
      content: createEventMarkerContent(eventLocation.placeName),
      map: mapRef.current,
      yAnchor: 1.1,
      zIndex: 10,
    });
    eventOverlayRef.current = overlay;

    fitBounds();
  }, [eventLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // 참가자 오버레이 갱신
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    const { maps } = window.kakao;

    const incoming = new Set(participants.map((p) => p.participantId));

    // 사라진 참가자 오버레이 제거
    for (const [id, overlay] of participantOverlaysRef.current) {
      if (!incoming.has(id)) {
        overlay.setMap(null);
        participantOverlaysRef.current.delete(id);
      }
    }

    // 추가/갱신
    for (const pin of participants) {
      if (pin.isArrived) {
        // 도착한 참가자는 오버레이 제거
        participantOverlaysRef.current.get(pin.participantId)?.setMap(null);
        participantOverlaysRef.current.delete(pin.participantId);
        continue;
      }

      const pos = new maps.LatLng(pin.lat, pin.lng);
      const existing = participantOverlaysRef.current.get(pin.participantId);

      if (existing) {
        existing.setPosition(pos);
        // DOM 내용 교체로 상태 갱신 (도착 색상 등)
        existing.setMap(null);
        participantOverlaysRef.current.delete(pin.participantId);
      }

      const overlay = new maps.CustomOverlay({
        position: pos,
        content: createParticipantOverlayContent(pin, onParticipantClick),
        map: mapRef.current!,
        yAnchor: 1.5,
        zIndex: 5,
      });
      participantOverlaysRef.current.set(pin.participantId, overlay);
    }

    fitBounds();
  }, [participants, onParticipantClick]); // eslint-disable-line react-hooks/exhaustive-deps

  // 사진 핀 갱신
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    const { maps } = window.kakao;

    const incoming = new Set(photoMarkers.map((m) => m.id));

    for (const [id, overlay] of photoOverlaysRef.current) {
      if (!incoming.has(id)) {
        overlay.setMap(null);
        photoOverlaysRef.current.delete(id);
      }
    }

    for (const marker of photoMarkers) {
      const pos = new maps.LatLng(marker.lat, marker.lng);
      const existing = photoOverlaysRef.current.get(marker.id);
      if (existing) {
        existing.setPosition(pos);
        continue;
      }
      const content = createPhotoMarkerContent(marker.url, marker.count, () => {
        onPhotoMarkerClick?.(marker.id);
      });
      const overlay = new maps.CustomOverlay({
        position: pos,
        content,
        map: mapRef.current!,
        yAnchor: 1.35,
        zIndex: 8,
      });
      photoOverlaysRef.current.set(marker.id, overlay);
    }

    fitBounds();
  }, [photoMarkers]); // eslint-disable-line react-hooks/exhaustive-deps

  // 내 위치 파란 점 갱신
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    const { maps } = window.kakao;

    if (myLocationOverlayRef.current) {
      myLocationOverlayRef.current.setMap(null);
      myLocationOverlayRef.current = null;
    }

    if (!myLocation) return;

    const pos = new maps.LatLng(myLocation.lat, myLocation.lng);
    myLocationOverlayRef.current = new maps.CustomOverlay({
      position: pos,
      content: createMyLocationOverlayContent(
        myLocation.profileImageUrl ?? null,
        myLocation.nickname ?? null,
      ),
      map: mapRef.current,
      yAnchor: 1.5,
      zIndex: 20,
    });
    // 새 myLocation이 들어오면 다른 마커와 함께 fit — eventLocation만 보이는 상태 회피.
    fitBounds();
  }, [myLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  function fitBounds() {
    if (autoFit === "never") return;
    if (autoFit === "first" && firstFitDoneRef.current) return;
    if (!mapRef.current || !window.kakao?.maps) return;
    const { maps } = window.kakao;
    const bounds = new maps.LatLngBounds();

    if (eventLocation) {
      bounds.extend(new maps.LatLng(eventLocation.lat, eventLocation.lng));
    }
    // myLocation도 fit 대상에 포함 — 빠지면 centerOn 직후 다른 effect의 fit으로
    // 다시 eventLocation 중심이 되어 파란 점이 화면 밖으로 밀려남.
    if (myLocation) {
      bounds.extend(new maps.LatLng(myLocation.lat, myLocation.lng));
    }
    for (const pin of participants) {
      if (!pin.isArrived) {
        bounds.extend(new maps.LatLng(pin.lat, pin.lng));
      }
    }
    for (const marker of photoMarkers) {
      bounds.extend(new maps.LatLng(marker.lat, marker.lng));
    }

    if (!bounds.isEmpty()) {
      mapRef.current.setBounds(bounds, 80, 80, 80, 80);
      firstFitDoneRef.current = true;
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full bg-gray-100", className)}
    />
  );
});
