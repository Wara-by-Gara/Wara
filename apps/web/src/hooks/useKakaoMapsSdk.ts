"use client";

import { useEffect, useState } from "react";

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

export const KAKAO_MAPS_SDK_SRC = APP_KEY
  ? `//dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false`
  : null;

const SCRIPT_ID = "kakao-maps-sdk";

let loadPromise: Promise<void> | null = null;

function invokeKakaoMapsLoad(): Promise<void> {
  return new Promise((resolve) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }
    resolve();
  });
}

/** Kakao Maps SDK 단일 로드 — 초대장 미리보기·전체 지도 페이지 공용 */
export function loadKakaoMapsSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!KAKAO_MAPS_SDK_SRC) return Promise.resolve();

  if (window.kakao?.maps) {
    return invokeKakaoMapsLoad();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const onScriptReady = () => {
      invokeKakaoMapsLoad().then(resolve).catch(reject);
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.kakao?.maps) {
        onScriptReady();
        return;
      }
      existing.addEventListener("load", onScriptReady, { once: true });
      // onLoad 이전에 마운트된 경우 대비
      const pollId = window.setInterval(() => {
        if (window.kakao?.maps) {
          window.clearInterval(pollId);
          onScriptReady();
        }
      }, 50);
      window.setTimeout(() => window.clearInterval(pollId), 10_000);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = KAKAO_MAPS_SDK_SRC;
    script.async = true;
    script.onload = onScriptReady;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("kakao_maps_sdk_load_failed"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useKakaoMapsSdk() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadKakaoMapsSdk()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
