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
  /** 내 현재 위치 — 파란 점으로 표시 */
  myLocation?: { lat: number; lng: number };
  /** 사진 위치 핀 목록 */
  photoMarkers?: PhotoMarker[];
  /** 사진 핀 클릭 콜백 — markerId는 클러스터 대표 사진 ID */
  onPhotoMarkerClick?: (markerId: string) => void;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울 시청

function createParticipantOverlayContent(pin: ParticipantPin): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  `;

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
  { ready, eventLocation, participants = [], className, myLocation, photoMarkers = [], onPhotoMarkerClick },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SdkKakaoMap | null>(null);
  const eventOverlayRef = useRef<SdkKakaoCustomOverlay | null>(null);
  const participantOverlaysRef = useRef<Map<string, SdkKakaoCustomOverlay>>(new Map());
  const myLocationOverlayRef = useRef<SdkKakaoCustomOverlay | null>(null);
  const photoOverlaysRef = useRef<Map<string, SdkKakaoCustomOverlay>>(new Map());
  const initializedRef = useRef(false);

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
        eventLocation?.lat ?? DEFAULT_CENTER.lat,
        eventLocation?.lng ?? DEFAULT_CENTER.lng,
      );
      mapRef.current = new maps.Map(containerRef.current, { center, level: 4 });
      initializedRef.current = true;
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
        content: createParticipantOverlayContent(pin),
        map: mapRef.current!,
        yAnchor: 1.5,
        zIndex: 5,
      });
      participantOverlaysRef.current.set(pin.participantId, overlay);
    }

    fitBounds();
  }, [participants]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const dot = document.createElement("div");
    dot.style.cssText = `
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid white;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.3), 0 2px 6px rgba(0,0,0,0.2);
    `;

    const pos = new maps.LatLng(myLocation.lat, myLocation.lng);
    myLocationOverlayRef.current = new maps.CustomOverlay({
      position: pos,
      content: dot,
      map: mapRef.current,
      yAnchor: 0.5,
      xAnchor: 0.5,
      zIndex: 20,
    });
  }, [myLocation]);

  function fitBounds() {
    if (!mapRef.current || !window.kakao?.maps) return;
    const { maps } = window.kakao;
    const bounds = new maps.LatLngBounds();

    if (eventLocation) {
      bounds.extend(new maps.LatLng(eventLocation.lat, eventLocation.lng));
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
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full bg-gray-100", className)}
    />
  );
});
