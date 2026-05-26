"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type { ParticipantLocation } from "@/lib/api/locations";

const WS_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
  onLocationUpdated: (update: LocationUpdate) => void;
  onArrived?: (event: ArrivedEvent) => void;
  enabled?: boolean;
}

export function useLocationSocket({
  invitationId,
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
    if (!enabled || !invitationId) return;

    const socket = io(`${WS_BASE}/locations`, {
      withCredentials: true,
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
  }, [invitationId, enabled]);

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
