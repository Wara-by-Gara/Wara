import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { NotificationsGateway } from './notifications.gateway';

const mockJwtService = { verifyAsync: jest.fn() };

function makeMockSocket(overrides?: Record<string, unknown>): jest.Mocked<Socket> {
  return {
    handshake: { auth: {}, headers: {}, query: {} },
    data: {} as Record<string, unknown>,
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<Socket>;
}

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let mockServer: { to: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get(NotificationsGateway);

    const emitMock = jest.fn();
    mockServer = { to: jest.fn().mockReturnValue({ emit: emitMock }) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gateway.server = mockServer as any;

    jest.clearAllMocks();
    mockServer.to.mockReturnValue({ emit: emitMock });
  });

  describe('handleConnection', () => {
    it('auth.token 유효 → data.user 설정 + join(user:{id})', async () => {
      const payload = { id: 'u1', role: 'member', scope: [] };
      mockJwtService.verifyAsync.mockResolvedValue(payload);
      const client = makeMockSocket({ handshake: { auth: { token: 'valid-token' }, headers: {}, query: {} } });

      await gateway.handleConnection(client);

      expect(client.data.user).toBe(payload);
      expect(client.join).toHaveBeenCalledWith('user:u1');
    });

    it('Authorization Bearer 헤더 유효 → 정상 연결', async () => {
      const payload = { id: 'u1', role: 'member', scope: [] };
      mockJwtService.verifyAsync.mockResolvedValue(payload);
      const client = makeMockSocket({
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer valid-token' },
          query: {},
        },
      });

      await gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith('user:u1');
    });

    it('쿠키 accessToken 유효 → 정상 연결', async () => {
      const payload = { id: 'u1', role: 'member', scope: [] };
      mockJwtService.verifyAsync.mockResolvedValue(payload);
      const client = makeMockSocket({
        handshake: {
          auth: {},
          headers: { cookie: 'accessToken=valid-token; other=val' },
          query: {},
        },
      });

      await gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith('user:u1');
    });

    it('token 없음 → disconnect()', async () => {
      const client = makeMockSocket({ handshake: { auth: {}, headers: {}, query: {} } });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });

    it('JWT 검증 실패 → disconnect()', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
      const client = makeMockSocket({ handshake: { auth: { token: 'bad-token' }, headers: {}, query: {} } });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('sendToUser', () => {
    it("server.to('user:{id}').emit('notification:new', notification)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const noti = { id: 'n1', content: 'hello' } as any;

      gateway.sendToUser('u1', noti);

      expect(mockServer.to).toHaveBeenCalledWith('user:u1');
      expect(mockServer.to('user:u1').emit).toHaveBeenCalledWith('notification:new', noti);
    });
  });

  describe('sendReadToUser', () => {
    it("server.to('user:{id}').emit('notification:read', { id })", () => {
      gateway.sendReadToUser('u1', 'n1');

      expect(mockServer.to).toHaveBeenCalledWith('user:u1');
      expect(mockServer.to('user:u1').emit).toHaveBeenCalledWith('notification:read', { id: 'n1' });
    });
  });

  describe('sendReadAllToUser', () => {
    it("server.to('user:{id}').emit('notification:readAll')", () => {
      gateway.sendReadAllToUser('u1');

      expect(mockServer.to).toHaveBeenCalledWith('user:u1');
      expect(mockServer.to('user:u1').emit).toHaveBeenCalledWith('notification:readAll');
    });
  });
});
