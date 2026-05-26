"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type { ParticipantLocation } from "@/lib/api/locations";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
// WebSocket connects to the base URL (not the /api/v1 path)
const WS_BASE = API_URL.replace(/\/api\/v1\/?$/, "");

export interface LocationUpdate extends ParticipantLocation {
  invitationId: string;
  updatedAt: string;
}

export interface ArrivedEvent {
  participantId: string;
  invitationId: string;
}

interface UseLocationSocketOptions {
  invitationId: string;
  token: string;
  onLocationUpdated: (update: LocationUpdate) => void;
  onArrived?: (event: ArrivedEvent) => void;
  enabled?: boolean;
}

export function useLocationSocket({
  invitationId,
  token,
  onLocationUpdated,
  onArrived,
  enabled = true,
}: UseLocationSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onLocationUpdated);
  callbackRef.current = onLocationUpdated;
  const arrivedRef = useRef(onArrived);
  arrivedRef.current = onArrived;

  useEffect(() => {
    if (!enabled || !invitationId || !token) return;

    const socket = io(`${WS_BASE}/locations`, {
      auth: { token: `Bearer ${token}` },
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("location:subscribe", { invitationId });
    });

    socket.on("location:updated", (update: LocationUpdate) => {
      callbackRef.current(update);
    });

    socket.on("location:arrived", (event: ArrivedEvent) => {
      arrivedRef.current?.(event);
    });

    return () => {
      socket.emit("location:unsubscribe", { invitationId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [invitationId, token, enabled]);

  const sendLocation = useCallback(
    (lat: number, lng: number, accuracy: number, isArrived?: boolean) => {
      socketRef.current?.emit("location:update", {
        invitationId,
        lat,
        lng,
        accuracy,
        ...(isArrived !== undefined ? { isArrived } : {}),
      });
    },
    [invitationId],
  );

  return { sendLocation };
}
