/**
 * AiGenerationsGateway 단위 테스트
 *
 * 검증 대상:
 * - 같은 user의 멀티 디바이스(여러 socket)는 동일 room에 join
 * - 다른 user는 서로 격리 (각자의 room)
 * - emitGenerationCompleted / Failed가 user room으로만 broadcast
 *
 * Origin/CORS 검증은 WaraIoAdapter에서 전역 처리되므로 본 spec 범위 밖.
 */
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { AiGenerationsGateway } from './ai-generations.gateway';

function makeSocket(opts: {
  auth?: Record<string, string>;
  headers?: Record<string, string>;
  rooms?: Set<string>;
}) {
  const joined = opts.rooms ?? new Set<string>();
  const socket = {
    data: {} as Record<string, unknown>,
    handshake: { auth: opts.auth ?? {}, headers: opts.headers ?? {} },
    join: jest.fn((room: string) => joined.add(room)),
    disconnect: jest.fn(),
  } as unknown as Socket;
  return { socket, joined };
}

function makeServer() {
  const emitters: Array<{ room: string; event: string; payload: unknown }> = [];
  const server = {
    to: jest.fn((room: string) => ({
      emit: jest.fn((event: string, payload: unknown) => {
        emitters.push({ room, event, payload });
      }),
    })),
  } as unknown as Server;
  return { server, emitters };
}

describe('AiGenerationsGateway.handleConnection', () => {
  it('정상 토큰 → user:userId room에 join', async () => {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({ id: 'user1' }),
    } as unknown as JwtService;
    const gw = new AiGenerationsGateway(jwt);
    const { socket, joined } = makeSocket({ auth: { token: 'ok' } });

    await gw.handleConnection(socket);

    expect(joined.has('user:user1')).toBe(true);
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('토큰 누락 → disconnect', async () => {
    const jwt = { verifyAsync: jest.fn() } as unknown as JwtService;
    const gw = new AiGenerationsGateway(jwt);
    const { socket } = makeSocket({});

    await gw.handleConnection(socket);

    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('토큰 검증 실패 → disconnect', async () => {
    const jwt = {
      verifyAsync: jest.fn().mockRejectedValue(new Error('bad')),
    } as unknown as JwtService;
    const gw = new AiGenerationsGateway(jwt);
    const { socket } = makeSocket({ auth: { token: 'forged' } });

    await gw.handleConnection(socket);

    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('같은 user의 두 socket → 동일 room', async () => {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({ id: 'user1' }),
    } as unknown as JwtService;
    const gw = new AiGenerationsGateway(jwt);
    const { socket: s1, joined: r1 } = makeSocket({ auth: { token: 't1' } });
    const { socket: s2, joined: r2 } = makeSocket({ auth: { token: 't2' } });

    await gw.handleConnection(s1);
    await gw.handleConnection(s2);

    expect(r1.has('user:user1')).toBe(true);
    expect(r2.has('user:user1')).toBe(true);
  });

  it('다른 user → 서로 다른 room', async () => {
    const jwt = {
      verifyAsync: jest
        .fn()
        .mockResolvedValueOnce({ id: 'user1' })
        .mockResolvedValueOnce({ id: 'user2' }),
    } as unknown as JwtService;
    const gw = new AiGenerationsGateway(jwt);
    const { socket: s1, joined: r1 } = makeSocket({ auth: { token: 't1' } });
    const { socket: s2, joined: r2 } = makeSocket({ auth: { token: 't2' } });

    await gw.handleConnection(s1);
    await gw.handleConnection(s2);

    expect(r1.has('user:user1')).toBe(true);
    expect(r1.has('user:user2')).toBe(false);
    expect(r2.has('user:user2')).toBe(true);
    expect(r2.has('user:user1')).toBe(false);
  });

  it('Authorization Bearer 헤더 fallback', async () => {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({ id: 'user1' }),
    } as unknown as JwtService;
    const gw = new AiGenerationsGateway(jwt);
    const { socket, joined } = makeSocket({
      headers: { authorization: 'Bearer ok' },
    });

    await gw.handleConnection(socket);

    expect(jwt.verifyAsync).toHaveBeenCalledWith('ok');
    expect(joined.has('user:user1')).toBe(true);
  });

  it('accessToken 쿠키 fallback', async () => {
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({ id: 'user1' }),
    } as unknown as JwtService;
    const gw = new AiGenerationsGateway(jwt);
    const { socket, joined } = makeSocket({
      headers: { cookie: 'foo=bar; accessToken=cookie-token; baz=qux' },
    });

    await gw.handleConnection(socket);

    expect(jwt.verifyAsync).toHaveBeenCalledWith('cookie-token');
    expect(joined.has('user:user1')).toBe(true);
  });
});

describe('AiGenerationsGateway.emit*', () => {
  it('emitGenerationCompleted — user room으로만 broadcast', () => {
    const gw = new AiGenerationsGateway({} as JwtService);
    const { server, emitters } = makeServer();
    (gw as unknown as { server: Server }).server = server;

    gw.emitGenerationCompleted('user1', 'gen1');

    expect(server.to).toHaveBeenCalledWith('user:user1');
    expect(emitters).toEqual([
      { room: 'user:user1', event: 'generation:completed', payload: { generationId: 'gen1' } },
    ]);
  });

  it('emitGenerationFailed — errorCode 포함하여 user room으로만', () => {
    const gw = new AiGenerationsGateway({} as JwtService);
    const { server, emitters } = makeServer();
    (gw as unknown as { server: Server }).server = server;

    gw.emitGenerationFailed('user2', 'gen2', 'AI_TIMEOUT');

    expect(server.to).toHaveBeenCalledWith('user:user2');
    expect(emitters[0]).toEqual({
      room: 'user:user2',
      event: 'generation:failed',
      payload: { generationId: 'gen2', errorCode: 'AI_TIMEOUT' },
    });
  });

  it('다른 user 호출 시 서로 다른 room으로 격리', () => {
    const gw = new AiGenerationsGateway({} as JwtService);
    const { server, emitters } = makeServer();
    (gw as unknown as { server: Server }).server = server;

    gw.emitGenerationCompleted('user1', 'gen1');
    gw.emitGenerationCompleted('user2', 'gen2');

    expect(emitters.map((e) => e.room)).toEqual(['user:user1', 'user:user2']);
  });
});
