"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useKakaoMapsSdk } from "@/hooks/useKakaoMapsSdk";
import { MapPage, type MapPageState, type SearchResult } from "@/screens/MapPage/MapPage";
import { KakaoMap, type KakaoMapHandle, type ParticipantPin } from "@/components/molecules/KakaoMap/KakaoMap";
import { useSetEventLocation, useParticipantLocations, useLocationSearch } from "@/hooks/useLocation";
import { useInvitation } from "@/hooks/useInvitations";
import { useParticipants } from "@/hooks/useParticipants";
import { useLocationSocket, type LocationUpdate } from "@/hooks/useLocationSocket";
import { useMe } from "@/hooks/useUsers";
import type { ParticipantLocation } from "@/lib/api/locations";
import type { Place } from "@/lib/api/locations";
import { nudgeParticipant } from "@/lib/api/locations";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { Button } from "@/components/primitives/Button";
import { toast } from "@/components/molecules/Toast";
import { ROUTES } from "@/constants/routes";

const ARRIVAL_THRESHOLD_METERS = 10;
// GPS emit 간격 — 너무 잦으면 서버 부하/배터리 부담.
const GPS_EMIT_THROTTLE_MS = 5000;
// 모임 시작 15분 전부터 위치 공유 활성 (PRD)
const PRE_EVENT_TRACK_WINDOW_MS = 15 * 60 * 1000;

function getEventEndMs(eventStartAt: string): number {
  const kstDate = new Date(eventStartAt).toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
  return new Date(`${kstDate}T23:59:59+09:00`).getTime();
}

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
  const mapSdkReady = useKakaoMapsSdk();

  // ── 화면 상태 ─────────────────────────────────────────────────────────
  const [pageState, setPageState] = useState<MapPageState>("loading");
  const [isDirectionOpen, setIsDirectionOpen] = useState(false);
  const [isArrived, setIsArrived] = useState(false);
  const [selectedPin, setSelectedPin] = useState<ParticipantPin | null>(null);
  const [nudgePending, setNudgePending] = useState(false);
  const [nudgeError, setNudgeError] = useState(false);

  // ── 장소 검색 ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pendingPlace, setPendingPlace] = useState<SearchResult | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── 서버 데이터 ───────────────────────────────────────────────────────
  // 장소는 invitation 상세에 포함된 eventLocation에서 파생.
  // (별도 GET /location은 장소 미설정 시 404를 던져 불필요한 에러 노이즈 발생)
  const {
    data: invitation,
    isLoading: locationLoading,
    isError: locationError,
    refetch,
  } = useInvitation(invitationId);
  const eventLocation = invitation?.eventLocation ?? null;
  const { data: participantsData } = useParticipants(invitationId);
  const { data: initialLocations } = useParticipantLocations(invitationId);
  const { mutate: saveLocation, isPending: isSavingPlace } = useSetEventLocation(invitationId);
  const { data: me } = useMe();

  const myParticipant = me
    ? participantsData?.participants.find((p) => p.user.id === me.id)
    : undefined;
  const myParticipantId = myParticipant?.participant.id;
  const isHost = myParticipant?.participant.memberRole === "HOST";

  // 모임 시작 15분 전 ~ 당일 23:59(KST)까지 위치 공유 활성.
  const eventStartAt = invitation?.eventStartAt ?? null;
  const inEventWindow = (() => {
    if (!eventStartAt) return false;
    const startMs = new Date(eventStartAt).getTime();
    if (Number.isNaN(startMs)) return false;
    const now = Date.now();
    const endMs = getEventEndMs(eventStartAt);
    return now >= startMs - PRE_EVENT_TRACK_WINDOW_MS && now <= endMs;
  })();

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
  const lastEmitAtRef = useRef<number>(0);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const kakaoMapRef = useRef<KakaoMapHandle>(null);

  // ── 내 위치 ────────────────────────────────────────────────────────────
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // 검색은 내 위치 기반 거리 정렬을 사용하므로 myLocation 선언 뒤에 호출.
  const {
    data: searchData,
    isLoading: isSearching,
    fetchNextPage: fetchNextSearchPage,
    hasNextPage: hasMoreSearch,
    isFetchingNextPage: isLoadingMoreSearch,
  } = useLocationSearch(debouncedQuery, myLocation);
  const searchPlacesFlat = useMemo(
    () => searchData?.pages.flatMap((p) => p.places) ?? [],
    [searchData],
  );

  // ── WebSocket ─────────────────────────────────────────────────────────
  const { sendLocation } = useLocationSocket({
    invitationId,
    enabled: gpsPermission === "granted" && !isArrived && inEventWindow,
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
          nickname: update.nickname,
          profileImageUrl: update.profileImageUrl,
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
      setIsArrived((prev) => prev || participantId === myParticipantId);
    }, [myParticipantId]),
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
    if (
      !pageState.startsWith("search") &&
      pageState !== "directionBottomSheet" &&
      pageState !== "selectedPlace"
    ) {
      // 장소 미설정(eventLocation null)이면 noLocation, 설정됐으면 지도 전체화면
      setPageState(eventLocation ? "fullscreen" : "noLocation");
    }
  }, [locationLoading, locationError, eventLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 호스트가 미설정 상태로 들어오면 곧바로 검색창 진입 ───────────────
  useEffect(() => {
    if (!isHost) return;
    if (locationLoading) return;
    if (eventLocation) return;
    if (pageState !== "noLocation") return;
    setPageState("searchInitial");
  }, [isHost, locationLoading, eventLocation, pageState]);

  // ── 검색 상태 동기화 ──────────────────────────────────────────────────
  useEffect(() => {
    if (!pageState.startsWith("search")) return;

    if (!searchQuery) {
      setPageState("searchInitial");
    } else if (isSearching) {
      setPageState("searchTyping");
    } else if (searchData && searchPlacesFlat.length === 0) {
      setPageState("searchEmpty");
    } else if (searchPlacesFlat.length > 0) {
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
  // watchPosition만 사용. OS가 위치 갱신할 때마다 콜백이 오므로
  // setInterval 폴링이 필요 없다. 콜백 안에서 시간 throttle로 emit.
  useEffect(() => {
    if (gpsPermission === "checking" || gpsPermission === "denied" || isArrived || !inEventWindow) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    const handlePosition = (pos: GeolocationPosition) => {
      lastPositionRef.current = pos;
      setGpsPermission("granted");
      setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });

      const now = Date.now();
      if (now - lastEmitAtRef.current < GPS_EMIT_THROTTLE_MS) return;
      lastEmitAtRef.current = now;

      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const nearEvent =
        eventLocation != null &&
        haversineDistance(lat, lng, eventLocation.lat, eventLocation.lng) <=
          ARRIVAL_THRESHOLD_METERS;
      sendLocation(lat, lng, accuracy, nearEvent || undefined);
      if (nearEvent) setIsArrived(true);
    };

    const startWatch = () => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        () => setGpsPermission("denied"),
        { enableHighAccuracy: true, maximumAge: 0 },
      );
    };

    if (gpsPermission === "granted") {
      startWatch();
    } else {
      // "prompt" — 권한 팝업 유도
      navigator.geolocation.getCurrentPosition(
        () => {
          setGpsPermission("granted");
          startWatch();
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
    };
  }, [gpsPermission, isArrived, sendLocation, eventLocation, inEventWindow]);

  // ── 참가자 핀 빌드 ────────────────────────────────────────────────────
  // 참가자 50명 이상 모임에서 매 렌더마다 Map/Array를 새로 만들면 비싸므로 메모화.
  const participantMap = useMemo(
    () =>
      new Map(
        participantsData?.participants.map((p) => [p.participant.id, p.user]) ?? [],
      ),
    [participantsData],
  );
  // payload에 nickname/profileImageUrl이 포함되지만, 과거 응답·캐시 호환을 위해 participantMap을 fallback으로 둠.
  const participantPins: ParticipantPin[] = useMemo(
    () =>
      Array.from(participantLocations.values()).map((loc) => {
        const user = participantMap.get(loc.participantId);
        return {
          participantId: loc.participantId,
          lat: loc.lat,
          lng: loc.lng,
          profileImageUrl: loc.profileImageUrl ?? user?.profileImageUrl ?? null,
          nickname: loc.nickname ?? user?.nickname ?? null,
          isArrived: loc.isArrived,
        };
      }),
    [participantLocations, participantMap],
  );

  // ── 핸들러 ───────────────────────────────────────────────────────────
  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("이 브라우저는 위치 기능을 지원하지 않아요");
      setGpsPermission("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        lastPositionRef.current = p;
        setGpsPermission("granted");
        setMyLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
        kakaoMapRef.current?.centerOn(p.coords.latitude, p.coords.longitude);
      },
      (err) => {
        // PositionError.code: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
        if (err.code === 1) {
          toast.error("위치 권한이 꺼져있어요. 브라우저 주소창 옆 아이콘을 눌러 허용해주세요.");
          setGpsPermission("denied");
        } else if (err.code === 3) {
          toast.error("위치를 가져오는 데 시간이 오래 걸려요. 잠시 후 다시 시도해주세요.");
        } else {
          toast.error("현재 위치를 가져올 수 없어요.");
        }
      },
      // 무한 대기 방지 + maximumAge=0으로 항상 최신 fetch
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  };

  const handleGetDirections = () => setIsDirectionOpen(true);

  // 브라우저별 위치 권한 설정 화면 진입.
  // - iOS Safari WebKit: app-settings: 스킴이 시스템 설정 앱을 열어줌
  // - 그 외(Android, 데스크톱 브라우저, in-app webview 등): 시스템 스킴 미지원 →
  //   사용자에게 브라우저 권한을 직접 조정하도록 안내
  const handleOpenSettings = () => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIOSSafari = /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (isIOSSafari) {
      window.location.href = "app-settings:";
      return;
    }
    alert(
      "브라우저 주소창 옆 자물쇠 아이콘을 눌러 위치 권한을 허용으로 변경해주세요.",
    );
  };

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
    setPendingPlace(place);
    setPageState("selectedPlace");
  };

  const handleConfirmSelectedPlace = () => {
    if (!pendingPlace) return;
    saveLocation(
      {
        address: pendingPlace.address,
        placeName: pendingPlace.placeName,
        lat: pendingPlace.lat,
        lng: pendingPlace.lng,
        placeId: pendingPlace.placeId,
      },
      {
        onSuccess: () => {
          setPendingPlace(null);
          setSearchQuery("");
          // 호스트가 장소 확정 후 별도 뒤로가기 없이 초대장 상세로 자동 복귀.
          router.push(ROUTES.INVITATIONS.DETAIL(invitationId));
        },
      },
    );
  };

  const handleSearchQueryChange = (q: string) => {
    setSearchQuery(q);
    if (!pageState.startsWith("search")) {
      setPageState("searchInitial");
    }
  };

  const handleBack = () => {
    if (pageState === "selectedPlace" && pendingPlace) {
      setPendingPlace(null);
      setPageState(searchPlacesFlat.length > 0 ? "searchResults" : "searchInitial");
      return;
    }
    router.back();
  };

  const handleLoadMoreSearch = () => {
    if (hasMoreSearch && !isLoadingMoreSearch) fetchNextSearchPage();
  };

  // Kakao 45개 상한에 막혀 매칭 결과 일부만 노출된 경우 → 구체화 안내
  const lastSearchMeta = searchData?.pages.at(-1)?.meta;
  const searchCapReached =
    !hasMoreSearch &&
    !!lastSearchMeta &&
    lastSearchMeta.totalCount > searchPlacesFlat.length;

  const searchResultsForPage: SearchResult[] = searchPlacesFlat.map(
    (p: Place) => ({
      placeId: p.placeId,
      placeName: p.placeName,
      address: p.roadAddress || p.address,
      lat: p.lat,
      lng: p.lng,
    }),
  );

  const resolvedState: MapPageState = isDirectionOpen ? "directionBottomSheet" : pageState;

  // 선택 중인 후보 우선, 없으면 저장된 행사 장소
  const effectiveLocation = pendingPlace
    ? {
        placeName: pendingPlace.placeName,
        address: pendingPlace.address,
        lat: pendingPlace.lat,
        lng: pendingPlace.lng,
      }
    : eventLocation
      ? {
          placeName: eventLocation.placeName,
          address: eventLocation.address,
          lat: eventLocation.lat,
          lng: eventLocation.lng,
        }
      : null;

  const handleParticipantPinClick = useCallback(
    (pin: ParticipantPin) => {
      if (!isHost || pin.isArrived) return;
      setSelectedPin(pin);
      setNudgeError(false);
    },
    [isHost],
  );

  const handleSendNudge = async () => {
    if (!selectedPin) return;
    setNudgePending(true);
    setNudgeError(false);
    try {
      await nudgeParticipant(invitationId, selectedPin.participantId);
      setSelectedPin(null);
    } catch {
      setNudgeError(true);
    } finally {
      setNudgePending(false);
    }
  };

  const selectedDistanceM =
    selectedPin && effectiveLocation?.lat != null && effectiveLocation?.lng != null
      ? Math.round(
          haversineDistance(
            selectedPin.lat,
            selectedPin.lng,
            effectiveLocation.lat,
            effectiveLocation.lng,
          ),
        )
      : null;

  const mapSlot = (
    <KakaoMap
      ref={kakaoMapRef}
      ready={mapSdkReady}
      eventLocation={
        effectiveLocation
          ? { lat: effectiveLocation.lat, lng: effectiveLocation.lng, placeName: effectiveLocation.placeName }
          : undefined
      }
      participants={participantPins}
      myLocation={
        myLocation
          ? {
              ...myLocation,
              profileImageUrl: me?.profileImageUrl ?? null,
              nickname: me?.nickname ?? null,
            }
          : undefined
      }
      onParticipantClick={isHost ? handleParticipantPinClick : undefined}
      className="absolute inset-0"
    />
  );

  return (
    <>
      <MapPage
        state={resolvedState}
        onBack={handleBack}
        eventLocation={effectiveLocation}
        onGetDirections={handleGetDirections}
        onRetry={() => refetch()}
        mapSlot={mapSlot}
        isArrived={isArrived}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        searchResults={searchResultsForPage}
        onLoadMoreSearch={handleLoadMoreSearch}
        isLoadingMoreSearch={isLoadingMoreSearch}
        searchCapReached={searchCapReached}
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
        onOpenSettings={handleOpenSettings}
        isHost={isHost}
        onSetLocation={() => setPageState("searchInitial")}
        onLocate={handleLocate}
        onConfirmSelectedPlace={isHost ? handleConfirmSelectedPlace : undefined}
        isSavingPlace={isSavingPlace}
        trackingActive={inEventWindow}
      />
      <BottomSheet open={!!selectedPin} onOpenChange={(open) => !open && setSelectedPin(null)}>
        <BottomSheetContent
          title={selectedPin?.nickname ?? "참석자"}
          description={
            selectedDistanceM != null
              ? `모임 장소까지 약 ${selectedDistanceM}m`
              : undefined
          }
        >
          <div className="flex flex-col gap-2 pt-2">
            {nudgeError ? (
              <p className="text-[13px] text-(--color-warning)">
                알림 전송에 실패했어요. 다시 시도해주세요.
              </p>
            ) : null}
            <Button
              size="lg"
              variant="primary"
              fullWidth
              loading={nudgePending}
              onClick={() => void handleSendNudge()}
            >
              출발 알림 보내기
            </Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
