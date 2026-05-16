import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import type { Notification } from '../../drizzle/schema';

@WebSocketGateway({ namespace: '/notifications', cors: true })
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

  private extractToken(client: Socket): string {
    const token = client.handshake.auth?.token as string | undefined;
    if (typeof token === 'string' && token.length > 0) return token;

    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    throw new Error('NO_TOKEN');
  }
}
