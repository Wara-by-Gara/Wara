import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { KakaoLocalService } from './kakao-local.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ErrorCode } from '../common/constants/error-codes';
import type { SetEventLocationDto } from './dto/set-event-location.dto';
import type { UpdateParticipantLocationDto } from './dto/update-participant-location.dto';

export const ARRIVAL_RADIUS_METERS = 10;
export const ARRIVAL_NOTIFICATION_DELAY_MS = 10_000;

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class LocationsService {
  constructor(
    private readonly repository: LocationsRepository,
    private readonly kakaoLocal: KakaoLocalService,
    private readonly notifications: NotificationsService,
  ) {}

  async getEventLocation(invitationId: string) {
    const location = await this.repository.findEventLocation(invitationId);
    if (!location) {
      throw new NotFoundException(ErrorCode.LOCATION_NOT_FOUND);
    }
    return location;
  }

  async setEventLocation(invitationId: string, dto: SetEventLocationDto) {
    return this.repository.upsertEventLocation(invitationId, dto);
  }

  async deleteEventLocation(invitationId: string) {
    await this.repository.deleteEventLocation(invitationId);
  }

  async getParticipantLocations(invitationId: string) {
    return this.repository.findAllParticipantLocations(invitationId);
  }

  async searchPlaces(query: string, page: number, size: number) {
    return this.kakaoLocal.searchByKeyword(query, page, size);
  }

  async updateMyLocation(
    invitationId: string,
    userId: string,
    dto: UpdateParticipantLocationDto,
  ): Promise<{ location: Awaited<ReturnType<LocationsRepository['upsertParticipantLocation']>>; justArrived: boolean }> {
    const participant = await this.repository.findParticipantWithUser(
      userId,
      invitationId,
    );
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }

    const location = await this.repository.upsertParticipantLocation(
      invitationId,
      participant.id,
      dto,
    );

    if (location.isArrived) {
      return { location, justArrived: false };
    }

    const eventLocation =
      await this.repository.findEventLocation(invitationId);
    if (!eventLocation) {
      return { location, justArrived: false };
    }

    const distance = haversineMeters(
      location.lat,
      location.lng,
      eventLocation.lat,
      eventLocation.lng,
    );
    if (distance > ARRIVAL_RADIUS_METERS) {
      return { location, justArrived: false };
    }

    // Atomically mark arrived — prevents duplicate processing on concurrent updates
    const marked = await this.repository.setArrivedIfNotYet(
      participant.id,
      invitationId,
    );
    if (!marked) {
      return { location, justArrived: false };
    }

    void this.sendArrivalNotificationsDelayed(invitationId, participant);

    return { location: { ...location, isArrived: true }, justArrived: true };
  }

  async nudgeParticipant(
    invitationId: string,
    hostUserId: string,
    participantId: string,
  ) {
    const participant = await this.repository.findParticipantById(
      participantId,
      invitationId,
    );
    if (!participant) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }

    await this.notifications.notify({
      userId: participant.userId,
      actorUserId: hostUserId,
      type: 'nudge',
      content: '모임 장소로 출발해주세요!',
      targetType: 'invitation',
      targetId: invitationId,
      invitationId,
    });
  }

  private async sendArrivalNotificationsDelayed(
    invitationId: string,
    participant: { userId: string; user: { name: string | null; nickname: string | null } },
  ) {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, ARRIVAL_NOTIFICATION_DELAY_MS),
    );

    const host = await this.repository.findHostByInvitation(invitationId);
    const arrivedName =
      participant.user.name ?? participant.user.nickname ?? '참석자';

    const tasks: Promise<unknown>[] = [
      this.notifications.notify({
        userId: participant.userId,
        type: 'arrived',
        content: '모임 장소 근처에 도착했어요. 위치 공유를 종료합니다.',
        targetType: 'participantLocations',
        targetId: invitationId,
        invitationId,
      }),
    ];

    if (host && host.userId !== participant.userId) {
      tasks.push(
        this.notifications.notify({
          userId: host.userId,
          actorUserId: participant.userId,
          type: 'arrived',
          content: `${arrivedName}님이 도착했어요!`,
          targetType: 'participantLocations',
          targetId: invitationId,
          invitationId,
        }),
      );
    }

    await Promise.all(tasks);
  }
}
