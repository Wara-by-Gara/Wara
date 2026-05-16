import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  WsException,
} from '@nestjs/websockets';
import { HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { LocationsService } from './locations.service';
import { UpdateParticipantLocationSchema } from './dto/update-participant-location.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

const SubscribePayloadSchema = z.object({ invitationId: z.string().min(1) });

const WsLocationUpdateSchema = UpdateParticipantLocationSchema.extend({
  invitationId: z.string().min(1),
});

@WebSocketGateway({ namespace: '/locations', cors: true })
export class LocationsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private readonly locationsService: LocationsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('location:subscribe')
  handleSubscribe(client: Socket, payload: unknown) {
    const result = SubscribePayloadSchema.safeParse(payload);
    if (!result.success) throw new WsException('INVALID_PAYLOAD');

    const { invitationId } = result.data;
    client.join(`invitation:${invitationId}`);
    return { invitationId };
  }

  @SubscribeMessage('location:unsubscribe')
  handleUnsubscribe(client: Socket, payload: unknown) {
    const result = SubscribePayloadSchema.safeParse(payload);
    if (!result.success) throw new WsException('INVALID_PAYLOAD');

    client.leave(`invitation:${result.data.invitationId}`);
  }

  @SubscribeMessage('location:update')
  async handleLocationUpdate(client: Socket, payload: unknown) {
    const result = WsLocationUpdateSchema.safeParse(payload);
    if (!result.success) throw new WsException('INVALID_PAYLOAD');

    const user = client.data.user as JwtPayload;
    const { invitationId, ...dto } = result.data;

    try {
      const location = await this.locationsService.updateMyLocation(
        invitationId,
        user.id,
        dto,
      );

      this.server
        .to(`invitation:${invitationId}`)
        .emit('location:updated', location);

      return location;
    } catch (err) {
      if (err instanceof HttpException) {
        throw new WsException(err.message);
      }
      throw new WsException('INTERNAL_ERROR');
    }
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
