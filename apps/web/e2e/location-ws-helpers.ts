/**
 * Locations WebSocket E2E 헬퍼.
 *
 * BE Gateway 정책:
 * - namespace `/locations`
 * - handshake.auth.token 으로 JWT 인증 (또는 Authorization header)
 * - `location:subscribe { invitationId }` emit으로 room join. ack로 join 결과 반환.
 * - WsException은 'exception' 이벤트로 클라이언트에 전달.
 */
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.E2E_API_URL ?? "http://localhost:3001";

export type WsException = { status: "error"; message: string } | { message: string };

export function createLocationSocket(token: string): Socket {
  return io(`${SOCKET_URL}/locations`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
    forceNew: true,
  });
}

export async function waitForConnect(socket: Socket, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("ws connect timeout")), timeoutMs);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once("connect_error", (err) => {
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error(String(err)));
    });
    socket.once("disconnect", (reason) => {
      clearTimeout(timer);
      reject(new Error(`disconnected before connect: ${reason}`));
    });
  });
}

export async function waitForEvent<T = unknown>(
  socket: Socket,
  event: string,
  timeoutMs = 5000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`event '${event}' timeout`)),
      timeoutMs,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

/** subscribe → ack 반환 (성공) 또는 exception 이벤트 (실패) */
export async function subscribeToInvitation(
  socket: Socket,
  invitationId: string,
  timeoutMs = 5000,
): Promise<{ ok: true; ack: { invitationId: string } } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ ok: false, error: "subscribe timeout" });
    }, timeoutMs);

    const onException = (payload: unknown) => {
      clearTimeout(timer);
      socket.off("exception", onException);
      const msg =
        typeof payload === "object" && payload !== null && "message" in payload
          ? String((payload as { message: unknown }).message)
          : typeof payload === "string"
            ? payload
            : "UNKNOWN_ERROR";
      resolve({ ok: false, error: msg });
    };
    socket.on("exception", onException);

    socket.emit("location:subscribe", { invitationId }, (ack: unknown) => {
      clearTimeout(timer);
      socket.off("exception", onException);
      if (ack && typeof ack === "object" && "invitationId" in ack) {
        resolve({ ok: true, ack: ack as { invitationId: string } });
      } else {
        resolve({ ok: false, error: "no ack" });
      }
    });
  });
}

export function disconnect(socket: Socket | undefined): void {
  if (!socket) return;
  if (socket.connected) socket.disconnect();
  socket.removeAllListeners();
}

/**
 * 서버가 인증 실패로 client.disconnect()를 호출하는 경우를 검증.
 * connect 직후 즉시 disconnect, 또는 connect_error 중 어느 쪽이든 통과.
 */
export async function waitForServerDisconnect(
  socket: Socket,
  timeoutMs = 3000,
): Promise<{ reason: "connect_error" | "disconnect" }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("expected server disconnect, but socket stayed connected")),
      timeoutMs,
    );
    socket.once("connect_error", () => {
      clearTimeout(timer);
      resolve({ reason: "connect_error" });
    });
    socket.once("disconnect", () => {
      clearTimeout(timer);
      resolve({ reason: "disconnect" });
    });
  });
}

/**
 * 일정 시간 동안 특정 event가 발생하지 않음을 확인.
 * cross-room broadcast 격리 검증에 사용.
 */
export async function expectNoEvent(
  socket: Socket,
  event: string,
  durationMs = 2000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onEvent = (payload: unknown) => {
      socket.off(event, onEvent);
      reject(new Error(`unexpected event '${event}': ${JSON.stringify(payload)}`));
    };
    socket.on(event, onEvent);
    setTimeout(() => {
      socket.off(event, onEvent);
      resolve();
    }, durationMs);
  });
}
