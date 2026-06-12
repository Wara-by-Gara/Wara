import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../common/types/jwt-payload.type';

// 사용자별 room: 같은 user의 멀티 디바이스에 동시 push.
const userRoom = (userId: string) => `user:${userId}`;

// 참고: Origin 검증은 WaraIoAdapter의 cors 설정에서 전역 처리됨 (FRONTEND_URL 외 차단).
// 본 Gateway는 JWT 인증과 room join만 담당.

@Injectable()
@WebSocketGateway({ namespace: '/ai-generations' })
export class AiGenerationsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data.user = payload;
      client.join(userRoom(payload.id));
    } catch {
      client.disconnect();
    }
  }

  emitGenerationCompleted(userId: string, generationId: string): void {
    this.server
      .to(userRoom(userId))
      .emit('generation:completed', { generationId });
  }

  emitGenerationFailed(userId: string, generationId: string, errorCode: string): void {
    this.server
      .to(userRoom(userId))
      .emit('generation:failed', { generationId, errorCode });
  }

  private extractToken(client: Socket): string {
    const token = client.handshake.auth?.token as string | undefined;
    if (typeof token === 'string' && token.length > 0) return token;

    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    const cookieHeader = client.handshake.headers.cookie;
    if (typeof cookieHeader === 'string') {
      for (const part of cookieHeader.split(';')) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const key = part.slice(0, idx).trim();
        if (key === 'accessToken') {
          try {
            return decodeURIComponent(part.slice(idx + 1).trim());
          } catch {
            return part.slice(idx + 1).trim();
          }
        }
      }
    }

    throw new Error('NO_TOKEN');
  }
}
