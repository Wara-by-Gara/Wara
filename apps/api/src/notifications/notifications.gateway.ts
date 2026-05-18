import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import type { Notification } from '../../drizzle/schema';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection {
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

  sendToUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  sendReadToUser(userId: string, notificationId: string) {
    this.server.to(`user:${userId}`).emit('notification:read', { id: notificationId });
  }

  sendReadAllToUser(userId: string) {
    this.server.to(`user:${userId}`).emit('notification:readAll');
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
      if (typeof accessToken === 'string' && accessToken.length > 0) return accessToken;
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
