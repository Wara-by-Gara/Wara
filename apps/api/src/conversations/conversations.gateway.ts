import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../common/types/jwt-payload.type';

export type ChatMessagePayload = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  deleted: boolean;
  edited: boolean;
  replyTo: {
    id: string;
    senderId: string;
    content: string;
    deleted: boolean;
  } | null;
};

@WebSocketGateway({
  namespace: '/dm',
})
export class ConversationsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data.user = payload;
      client.join(`user:${payload.id}`);
    } catch {
      client.disconnect();
    }
  }

  // 상대에게 새 메시지 푸시
  sendMessageToUser(userId: string, message: ChatMessagePayload) {
    this.server.to(`user:${userId}`).emit('message:new', message);
  }

  // 상대가 읽음 → 동기화 (readerId가 conversationId를 어디까지 읽었음)
  sendReadToUser(userId: string, conversationId: string, readerId: string) {
    this.server
      .to(`user:${userId}`)
      .emit('message:read', { conversationId, readerId });
  }

  // 메시지 삭제 동기화
  sendMessageDeleted(userId: string, conversationId: string, messageId: string) {
    this.server
      .to(`user:${userId}`)
      .emit('message:deleted', { conversationId, messageId });
  }

  // 메시지 수정 동기화
  sendMessageEdited(userId: string, message: ChatMessagePayload) {
    this.server.to(`user:${userId}`).emit('message:edited', message);
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
      const accessToken = this.parseCookieHeader(cookieHeader)['accessToken'];
      if (typeof accessToken === 'string' && accessToken.length > 0)
        return accessToken;
    }

    throw new Error('NO_TOKEN');
  }

  private parseCookieHeader(header: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    for (const part of header.split(';')) {
      const idx = part.indexOf('=');
      if (idx < 0) continue;
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
    return cookies;
  }
}
