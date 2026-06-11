import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  WsException,
} from '@nestjs/websockets';
import { HttpException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { LocationsService, ARRIVAL_NOTIFICATION_DELAY_MS } from './locations.service';
import { UpdateParticipantLocationSchema } from './dto/update-participant-location.dto';
import { ParticipantRepository } from '../common/repositories/participant.repository';
import type { JwtPayload } from '../common/types/jwt-payload.type';

const SubscribePayloadSchema = z.object({ invitationId: z.string().min(1) });

const WsLocationUpdateSchema = UpdateParticipantLocationSchema.extend({
  invitationId: z.string().min(1),
});

@WebSocketGateway({ namespace: '/locations' })
export class LocationsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    // Service ↔ Gateway 순환 의존 회피 — Service도 forwardRef(() => LocationsGateway)를 사용함.
    @Inject(forwardRef(() => LocationsService))
    private readonly locationsService: LocationsService,
    private readonly jwtService: JwtService,
    private readonly participantRepository: ParticipantRepository,
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
  async handleSubscribe(client: Socket, payload: unknown) {
    const result = SubscribePayloadSchema.safeParse(payload);
    if (!result.success) throw new WsException('INVALID_PAYLOAD');

    // 비참여자가 임의 invitationId로 join하면 다른 참여자의 GPS broadcast를 수신할 수 있어
    // 개인정보 누출. participant 여부를 확인 후에만 room join 허용.
    const user = client.data.user as JwtPayload | undefined;
    if (!user) throw new WsException('UNAUTHORIZED');

    const { invitationId } = result.data;
    const participant = await this.participantRepository.findByUserAndInvitation(
      user.id,
      invitationId,
    );
    if (!participant) throw new WsException('PARTICIPANT_NOT_FOUND');

    // 불참(absent) 게스트는 다른 참여자의 GPS 열람 차단. HOST는 모니터링 위해 RSVP 무관.
    if (participant.memberRole !== 'HOST' && participant.rsvpStatus === 'absent') {
      throw new WsException('RSVP_PERMISSION_DENIED');
    }

    client.join(`invitation:${invitationId}`);
    return { invitationId };
  }

  @SubscribeMessage('location:unsubscribe')
  handleUnsubscribe(client: Socket, payload: unknown) {
    const result = SubscribePayloadSchema.safeParse(payload);
    if (!result.success) throw new WsException('INVALID_PAYLOAD');

    client.leave(`invitation:${result.data.invitationId}`);
  }

  /**
   * 특정 participant의 GPS marker를 다른 클라이언트에서 즉시 제거.
   * stopMyLocationSharing / leave / 회원탈퇴 등에서 호출.
   */
  emitLocationRemoved(invitationId: string, participantId: string): void {
    this.server
      .to(`invitation:${invitationId}`)
      .emit('location:removed', { invitationId, participantId });
  }

  @SubscribeMessage('location:update')
  async handleLocationUpdate(client: Socket, payload: unknown) {
    const result = WsLocationUpdateSchema.safeParse(payload);
    if (!result.success) throw new WsException('INVALID_PAYLOAD');

    const user = client.data.user as JwtPayload;
    const { invitationId, ...dto } = result.data;

    try {
      const { location, justArrived } =
        await this.locationsService.updateMyLocation(invitationId, user.id, dto);

      this.server
        .to(`invitation:${invitationId}`)
        .emit('location:updated', location);

      if (justArrived) {
        setTimeout(() => {
          this.server
            .to(`invitation:${invitationId}`)
            .emit('location:arrived', {
              participantId: location.participantId,
              invitationId,
            });
        }, ARRIVAL_NOTIFICATION_DELAY_MS);
      }

      return location;
    } catch (err) {
      if (err instanceof HttpException) {
        // err.message raw 노출 금지 — ErrorCode 객체일 때만 code, 외엔 generic
        const response = err.getResponse();
        const code =
          typeof response === 'object' && response !== null && 'code' in response
            ? String((response as { code: unknown }).code)
            : 'HTTP_ERROR';
        throw new WsException(code);
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
