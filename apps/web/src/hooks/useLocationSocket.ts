"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type { ParticipantLocation } from "@/lib/api/locations";
import { SOCKET_BASE } from "@/lib/env";

export interface LocationUpdate extends ParticipantLocation {
  invitationId: string;
  updatedAt: string;
}

export interface ArrivedEvent {
  participantId: string;
  invitationId: string;
}

export interface LocationRemovedEvent {
  participantId: string;
  invitationId: string;
}

export interface StatusMessageUpdatedEvent {
  participantId: string;
  invitationId: string;
  statusMessage: string;
  updatedAt: string;
}

interface UseLocationSocketOptions {
  invitationId: string;
  onLocationUpdated: (update: LocationUpdate) => void;
  onArrived?: (event: ArrivedEvent) => void;
  onLocationRemoved?: (event: LocationRemovedEvent) => void;
  onStatusMessageUpdated?: (event: StatusMessageUpdatedEvent) => void;
  onStatusMessageRemoved?: (event: LocationRemovedEvent) => void;
  enabled?: boolean;
}

export function useLocationSocket({
  invitationId,
  onLocationUpdated,
  onArrived,
  onLocationRemoved,
  onStatusMessageUpdated,
  onStatusMessageRemoved,
  enabled = true,
}: UseLocationSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onLocationUpdated);
  callbackRef.current = onLocationUpdated;
  const arrivedRef = useRef(onArrived);
  arrivedRef.current = onArrived;
  const removedRef = useRef(onLocationRemoved);
  removedRef.current = onLocationRemoved;
  const statusUpdatedRef = useRef(onStatusMessageUpdated);
  statusUpdatedRef.current = onStatusMessageUpdated;
  const statusRemovedRef = useRef(onStatusMessageRemoved);
  statusRemovedRef.current = onStatusMessageRemoved;

  useEffect(() => {
    if (!enabled || !invitationId) return;

    const socket = io(`${SOCKET_BASE}/locations`, {
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

    socket.on("location:removed", (event: LocationRemovedEvent) => {
      removedRef.current?.(event);
    });

    socket.on("status_message:updated", (event: StatusMessageUpdatedEvent) => {
      statusUpdatedRef.current?.(event);
    });

    socket.on("status_message:removed", (event: LocationRemovedEvent) => {
      statusRemovedRef.current?.(event);
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
