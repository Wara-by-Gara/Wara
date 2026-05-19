import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { LocationsGateway } from './locations.gateway';
import { LocationsService } from './locations.service';

const mockJwtService = { verifyAsync: jest.fn() };
const mockLocationsService = { updateMyLocation: jest.fn() };

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

describe('LocationsGateway', () => {
  let gateway: LocationsGateway;
  let emitMock: jest.Mock;
  let mockServer: { to: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: LocationsService, useValue: mockLocationsService },
      ],
    }).compile();

    gateway = module.get(LocationsGateway);

    emitMock = jest.fn();
    mockServer = { to: jest.fn().mockReturnValue({ emit: emitMock }) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gateway.server = mockServer as any;

    jest.clearAllMocks();
    mockServer.to.mockReturnValue({ emit: emitMock });
  });

  describe('handleConnection', () => {
    it('auth.token 유효 → client.data.user 설정', async () => {
      const payload = { id: 'u1', role: 'member', scope: [] };
      mockJwtService.verifyAsync.mockResolvedValue(payload);
      const client = makeMockSocket({ handshake: { auth: { token: 'valid' }, headers: {}, query: {} } });

      await gateway.handleConnection(client);

      expect(client.data.user).toBe(payload);
    });

    it('token 없음 → disconnect()', async () => {
      const client = makeMockSocket({ handshake: { auth: {}, headers: {}, query: {} } });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });

    it('JWT 검증 실패 → disconnect()', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      const client = makeMockSocket({ handshake: { auth: { token: 'bad' }, headers: {}, query: {} } });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleSubscribe', () => {
    it('유효 payload → client.join + { invitationId } 반환', () => {
      const client = makeMockSocket();
      const result = gateway.handleSubscribe(client, { invitationId: 'inv1' });

      expect(client.join).toHaveBeenCalledWith('invitation:inv1');
      expect(result).toEqual({ invitationId: 'inv1' });
    });

    it('무효 payload → WsException(INVALID_PAYLOAD)', () => {
      const client = makeMockSocket();

      expect(() => gateway.handleSubscribe(client, {})).toThrow(
        new WsException('INVALID_PAYLOAD'),
      );
    });
  });

  describe('handleUnsubscribe', () => {
    it('유효 payload → client.leave', () => {
      const client = makeMockSocket();

      gateway.handleUnsubscribe(client, { invitationId: 'inv1' });

      expect(client.leave).toHaveBeenCalledWith('invitation:inv1');
    });

    it('무효 payload → WsException(INVALID_PAYLOAD)', () => {
      const client = makeMockSocket();

      expect(() => gateway.handleUnsubscribe(client, {})).toThrow(
        new WsException('INVALID_PAYLOAD'),
      );
    });
  });

  describe('handleLocationUpdate', () => {
    const validPayload = { invitationId: 'inv1', lat: 37.5, lng: 127.0, accuracy: 10 };

    it('성공 → updateMyLocation 호출 + emit(location:updated)', async () => {
      const client = makeMockSocket();
      client.data.user = { id: 'u1' };
      const saved = { id: 'l1', ...validPayload };
      mockLocationsService.updateMyLocation.mockResolvedValue(saved);

      const result = await gateway.handleLocationUpdate(client, validPayload);

      expect(mockLocationsService.updateMyLocation).toHaveBeenCalledWith('inv1', 'u1', {
        lat: 37.5,
        lng: 127.0,
        accuracy: 10,
      });
      expect(mockServer.to).toHaveBeenCalledWith('invitation:inv1');
      expect(emitMock).toHaveBeenCalledWith('location:updated', saved);
      expect(result).toBe(saved);
    });

    it('무효 payload → WsException(INVALID_PAYLOAD)', async () => {
      const client = makeMockSocket();
      client.data.user = { id: 'u1' };

      await expect(gateway.handleLocationUpdate(client, {})).rejects.toThrow(
        new WsException('INVALID_PAYLOAD'),
      );
    });

    it('HttpException → WsException(err.message)', async () => {
      const client = makeMockSocket();
      client.data.user = { id: 'u1' };
      mockLocationsService.updateMyLocation.mockRejectedValue(
        new HttpException('PARTICIPANT_NOT_FOUND', HttpStatus.FORBIDDEN),
      );

      await expect(gateway.handleLocationUpdate(client, validPayload)).rejects.toThrow(
        new WsException('PARTICIPANT_NOT_FOUND'),
      );
    });

    it('기타 에러 → WsException(INTERNAL_ERROR)', async () => {
      const client = makeMockSocket();
      client.data.user = { id: 'u1' };
      mockLocationsService.updateMyLocation.mockRejectedValue(new Error('unexpected'));

      await expect(gateway.handleLocationUpdate(client, validPayload)).rejects.toThrow(
        new WsException('INTERNAL_ERROR'),
      );
    });
  });
});
