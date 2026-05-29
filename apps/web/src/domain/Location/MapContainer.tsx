"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { MapPage, type MapPageState, type SearchResult } from "@/screens/MapPage/MapPage";
import { KakaoMap, type KakaoMapHandle, type ParticipantPin } from "@/components/molecules/KakaoMap/KakaoMap";
import { useEventLocation, useSetEventLocation, useParticipantLocations, useLocationSearch } from "@/hooks/useLocation";
import { useParticipants } from "@/hooks/useParticipants";
import { useLocationSocket, type LocationUpdate } from "@/hooks/useLocationSocket";
import { useMe } from "@/hooks/useUsers";
import type { ParticipantLocation } from "@/lib/api/locations";
import type { Place } from "@/lib/api/locations";

const ARRIVAL_THRESHOLD_METERS = 10;
const GPS_INTERVAL_MS = 5000;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface MapContainerProps {
  invitationId: string;
}

export function MapContainer({ invitationId }: MapContainerProps) {
  const router = useRouter();
  // ── SDK 준비 ──────────────────────────────────────────────────────────
  const [mapSdkReady, setMapSdkReady] = useState(false);

  // ── 화면 상태 ─────────────────────────────────────────────────────────
  const [pageState, setPageState] = useState<MapPageState>("loading");
  const [isDirectionOpen, setIsDirectionOpen] = useState(false);
  const [isArrived, setIsArrived] = useState(false);

  // ── 장소 검색 ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: searchData, isFetching: isSearching } = useLocationSearch(debouncedQuery);

  // ── 서버 데이터 ───────────────────────────────────────────────────────
  const {
    data: eventLocation,
    isLoading: locationLoading,
    isError: locationError,
    refetch,
  } = useEventLocation(invitationId);
  const { data: participantsData } = useParticipants(invitationId);
  const { data: initialLocations } = useParticipantLocations(invitationId);
  const { mutate: saveLocation } = useSetEventLocation(invitationId);
  const { data: me } = useMe();

  const isHost =
    !!me &&
    participantsData?.participants.some(
      (p) => p.user.id === me.id && p.participant.memberRole === "HOST",
    ) === true;

  // ── 참가자 실시간 위치 ─────────────────────────────────────────────────
  const [participantLocations, setParticipantLocations] = useState<
    Map<string, ParticipantLocation>
  >(new Map());

  useEffect(() => {
    if (!initialLocations) return;
    setParticipantLocations(new Map(initialLocations.map((loc) => [loc.participantId, loc])));
  }, [initialLocations]);

  // ── GPS 상태 ───────────────────────────────────────────────────────────
  const [gpsPermission, setGpsPermission] = useState<
    "checking" | "prompt" | "granted" | "denied"
  >("checking");

  const watchIdRef = useRef<number | null>(null);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const kakaoMapRef = useRef<KakaoMapHandle>(null);

  // ── 내 위치 ────────────────────────────────────────────────────────────
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // ── WebSocket ─────────────────────────────────────────────────────────
  const { sendLocation } = useLocationSocket({
    invitationId,
    enabled: gpsPermission === "granted" && !isArrived,
    onLocationUpdated: useCallback((update: LocationUpdate) => {
      setParticipantLocations((prev) => {
        const next = new Map(prev);
        next.set(update.participantId, {
          id: update.id,
          participantId: update.participantId,
          lat: update.lat,
          lng: update.lng,
          accuracy: update.accuracy,
          isArrived: update.isArrived,
        });
        return next;
      });
    }, []),
    onArrived: useCallback(({ participantId }: { participantId: string }) => {
      setParticipantLocations((prev) => {
        const loc = prev.get(participantId);
        if (!loc) return prev;
        const next = new Map(prev);
        next.set(participantId, { ...loc, isArrived: true });
        return next;
      });
      setIsArrived((prev) => prev || participantId === me?.id);
    }, [me?.id]),
  });

  // ── 페이지 상태 결정 ──────────────────────────────────────────────────
  useEffect(() => {
    if (locationLoading) {
      setPageState("loading");
      return;
    }
    if (locationError) {
      setPageState("noLocation");
      return;
    }
    if (!pageState.startsWith("search") && pageState !== "directionBottomSheet") {
      setPageState("fullscreen");
    }
  }, [locationLoading, locationError]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 검색 상태 동기화 ──────────────────────────────────────────────────
  useEffect(() => {
    if (!pageState.startsWith("search")) return;

    if (!searchQuery) {
      setPageState("searchInitial");
    } else if (isSearching) {
      setPageState("searchTyping");
    } else if (searchData && searchData.places.length === 0) {
      setPageState("searchEmpty");
    } else if (searchData && searchData.places.length > 0) {
      setPageState("searchResults");
    }
  }, [searchQuery, isSearching, searchData, pageState]);

  // ── GPS 권한 확인 ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsPermission("denied");
      return;
    }
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setGpsPermission(result.state as "prompt" | "granted" | "denied");
        result.addEventListener("change", () => {
          setGpsPermission(result.state as "prompt" | "granted" | "denied");
        });
      });
    } else {
      setGpsPermission("prompt");
    }
  }, []);

  // ── GPS 추적 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gpsPermission === "checking" || gpsPermission === "denied" || isArrived) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current);
        gpsIntervalRef.current = null;
      }
      return;
    }

    const startTracking = () => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          lastPositionRef.current = pos;
          setGpsPermission("granted");
          setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => setGpsPermission("denied"),
        { enableHighAccuracy: true, maximumAge: 0 },
      );

      gpsIntervalRef.current = setInterval(() => {
        const pos = lastPositionRef.current;
        if (!pos) return;
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const nearEvent =
          eventLocation != null &&
          haversineDistance(lat, lng, eventLocation.lat, eventLocation.lng) <=
            ARRIVAL_THRESHOLD_METERS;

        sendLocation(lat, lng, accuracy, nearEvent || undefined);
        if (nearEvent) setIsArrived(true);
      }, GPS_INTERVAL_MS);
    };

    if (gpsPermission === "granted") {
      startTracking();
    } else {
      // "prompt" — 권한 팝업 유도
      navigator.geolocation.getCurrentPosition(
        () => {
          setGpsPermission("granted");
          startTracking();
        },
        () => setGpsPermission("denied"),
        { enableHighAccuracy: true },
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current);
        gpsIntervalRef.current = null;
      }
    };
  }, [gpsPermission, isArrived, sendLocation, eventLocation]);

  // ── 참가자 핀 빌드 ────────────────────────────────────────────────────
  const participantMap = new Map(
    participantsData?.participants.map((p) => [p.participant.id, p.user]) ?? [],
  );
  const participantPins: ParticipantPin[] = Array.from(participantLocations.values()).map(
    (loc) => {
      const user = participantMap.get(loc.participantId);
      return {
        participantId: loc.participantId,
        lat: loc.lat,
        lng: loc.lng,
        profileImageUrl: user?.profileImageUrl ?? null,
        nickname: user?.nickname ?? null,
        isArrived: loc.isArrived,
      };
    },
  );

  // ── 핸들러 ───────────────────────────────────────────────────────────
  const handleLocate = () => {
    const pos = lastPositionRef.current;
    if (pos) {
      kakaoMapRef.current?.centerOn(pos.coords.latitude, pos.coords.longitude);
    } else {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setGpsPermission("granted");
          setMyLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
          kakaoMapRef.current?.centerOn(p.coords.latitude, p.coords.longitude);
        },
        () => setGpsPermission("denied"),
        { enableHighAccuracy: true },
      );
    }
  };

  const handleGetDirections = () => setIsDirectionOpen(true);

  const handleOpenKakaoMap = () => {
    if (!eventLocation) return;
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(eventLocation.placeName)},${eventLocation.lat},${eventLocation.lng}`;
    window.open(url, "_blank");
    setIsDirectionOpen(false);
  };

  const handleOpenNaverMap = () => {
    if (!eventLocation) return;
    const url = `https://map.naver.com/v5/search/${encodeURIComponent(eventLocation.placeName)}`;
    window.open(url, "_blank");
    setIsDirectionOpen(false);
  };

  const handleOpenGoogleMap = () => {
    if (!eventLocation) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${eventLocation.lat},${eventLocation.lng}`;
    window.open(url, "_blank");
    setIsDirectionOpen(false);
  };

  const handleSelectPlace = (place: SearchResult) => {
    saveLocation({
      address: place.address,
      placeName: place.placeName,
      lat: place.lat,
      lng: place.lng,
      placeId: place.placeId,
    });
    setSearchQuery("");
    setPageState("fullscreen");
  };

  const handleSearchQueryChange = (q: string) => {
    setSearchQuery(q);
    if (!pageState.startsWith("search")) {
      setPageState("searchInitial");
    }
  };

  const searchResultsForPage: SearchResult[] =
    searchData?.places.map((p: Place) => ({
      placeId: p.placeId,
      placeName: p.placeName,
      address: p.roadAddress || p.address,
      lat: p.lat,
      lng: p.lng,
    })) ?? [];

  const resolvedState: MapPageState = isDirectionOpen ? "directionBottomSheet" : pageState;

  const mapSlot = (
    <KakaoMap
      ref={kakaoMapRef}
      ready={mapSdkReady}
      eventLocation={
        eventLocation
          ? { lat: eventLocation.lat, lng: eventLocation.lng, placeName: eventLocation.placeName }
          : undefined
      }
      participants={participantPins}
      myLocation={myLocation}
      className="absolute inset-0"
    />
  );

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          window.kakao.maps.load(() => setMapSdkReady(true));
        }}
      />
      <MapPage
        state={resolvedState}
        onBack={() => router.back()}
        eventLocation={eventLocation ?? null}
        onGetDirections={handleGetDirections}
        onRetry={() => refetch()}
        mapSlot={mapSlot}
        isArrived={isArrived}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        searchResults={searchResultsForPage}
        onSelectPlace={handleSelectPlace}
        onOpenKakaoMap={handleOpenKakaoMap}
        onOpenNaverMap={handleOpenNaverMap}
        onOpenGoogleMap={handleOpenGoogleMap}
        onCloseDirections={() => setIsDirectionOpen(false)}
        onRequestPermission={() => {
          navigator.geolocation.getCurrentPosition(
            () => setGpsPermission("granted"),
            () => setGpsPermission("denied"),
          );
        }}
        onOpenSettings={() => window.open("app-settings:", "_self")}
        isHost={isHost}
        onSetLocation={() => setPageState("searchInitial")}
        onLocate={handleLocate}
      />
    </>
  );
}
