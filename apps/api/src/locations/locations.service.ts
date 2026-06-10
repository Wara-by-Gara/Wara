import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LocationsRepository, type ParticipantLocationWithUser } from './locations.repository';
import { LocationsRedisStore, type GpsRedisValue } from './locations.redis-store';
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

function syntheticLocationId(invitationId: string, participantId: string): string {
  return `${invitationId}:${participantId}`;
}

@Injectable()
export class LocationsService {
  constructor(
    private readonly repository: LocationsRepository,
    private readonly redisStore: LocationsRedisStore,
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
    // 호스트가 event location을 해제하면 위치 공유 컨텍스트가 끝난 것이므로
    // Redis의 모든 참여자 GPS hash + arrived lock을 즉시 정리.
    // 24h TTL을 기다리지 않고 즉시 broadcast 차단.
    await this.redisStore.deleteInvitation(invitationId);
  }

  async getParticipantLocations(
    invitationId: string,
  ): Promise<ParticipantLocationWithUser[]> {
    const map = await this.redisStore.findAllByInvitation(invitationId);
    if (map.size === 0) return [];

    const participantIds = Array.from(map.keys());
    const userInfo =
      await this.repository.findUserInfoByParticipantIds(participantIds);

    const result: ParticipantLocationWithUser[] = [];
    for (const [participantId, value] of map.entries()) {
      const user = userInfo.get(participantId);
      if (!user) continue; // 참가자 정보 사라진 stale entry
      result.push({
        id: syntheticLocationId(invitationId, participantId),
        invitationId,
        participantId,
        lat: value.lat,
        lng: value.lng,
        accuracy: value.accuracy,
        isArrived: value.isArrived,
        updatedAt: new Date(value.updatedAt),
        nickname: user.nickname,
        profileImageUrl: user.profileImageUrl,
      });
    }
    return result;
  }

  async searchPlaces(query: string, page: number, size: number) {
    return this.kakaoLocal.searchByKeyword(query, page, size);
  }

  // 사용자 탈퇴 시 호출 — 참여하던 모든 초대장의 Redis GPS entry + arrived lock 정리.
  // 다른 참여자가 24h TTL 동안 deleted 사용자의 stale 좌표를 보는 것을 차단.
  async cleanupUserGpsData(userId: string): Promise<void> {
    const pairs = await this.repository.findParticipantsByUserId(userId);
    if (pairs.length === 0) return;
    await Promise.all(
      pairs.map(({ invitationId, participantId }) =>
        this.redisStore.deleteParticipant(invitationId, participantId),
      ),
    );
  }

  // 사용자가 자기 GPS 공유를 즉시 종료. 본인 entry + arrived lock만 삭제 (다른 참여자 무영향).
  async stopMyLocationSharing(invitationId: string, userId: string): Promise<void> {
    const participant = await this.repository.findParticipantWithUser(
      userId,
      invitationId,
    );
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    await this.redisStore.deleteParticipant(invitationId, participant.id);
  }

  async updateMyLocation(
    invitationId: string,
    userId: string,
    dto: UpdateParticipantLocationDto,
  ): Promise<{ location: ParticipantLocationWithUser; justArrived: boolean }> {
    // 마감/삭제된 초대장에 GPS 계속 upsert되면 flush scheduler 정시까지 stale broadcast.
    // upsert 시점에 차단해 진입 자체를 막음.
    const invitationStatus = await this.repository.findInvitationStatus(invitationId);
    if (
      !invitationStatus ||
      invitationStatus.status === 'closed' ||
      invitationStatus.deletedAt !== null
    ) {
      throw new UnprocessableEntityException(ErrorCode.INVITATION_CLOSED);
    }

    const participant = await this.repository.findParticipantWithUser(
      userId,
      invitationId,
    );
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }

    const previous = await this.redisStore.findOne(invitationId, participant.id);
    const wasArrived = previous?.isArrived ?? false;

    const now = new Date();
    const value: GpsRedisValue = {
      lat: dto.lat,
      lng: dto.lng,
      accuracy: dto.accuracy,
      isArrived: wasArrived,
      updatedAt: now.toISOString(),
    };
    await this.redisStore.upsert(invitationId, participant.id, value);

    const location: ParticipantLocationWithUser = {
      id: syntheticLocationId(invitationId, participant.id),
      invitationId,
      participantId: participant.id,
      lat: dto.lat,
      lng: dto.lng,
      accuracy: dto.accuracy,
      isArrived: wasArrived,
      updatedAt: now,
      nickname: participant.user.nickname,
      profileImageUrl: participant.user.profileImageUrl,
    };

    if (wasArrived) {
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

    // SETNX로 중복 도착 처리 방지
    const claimed = await this.redisStore.claimArrival(
      invitationId,
      participant.id,
    );
    if (!claimed) {
      return { location, justArrived: false };
    }

    await this.redisStore.upsert(invitationId, participant.id, {
      ...value,
      isArrived: true,
    });

    void this.sendArrivalNotificationsDelayed(invitationId, participant);

    return { location: { ...location, isArrived: true }, justArrived: true };
  }

  async processPreEventNotifications() {
    const targets = await this.repository.findInvitationsForPreEventNotification();
    for (const inv of targets) {
      const userIds = await this.repository.findAllParticipantUserIds(inv.id);
      await Promise.all(
        userIds.map((userId) =>
          this.notifications.notify({
            userId,
            type: 'invitation_date',
            content: `[${inv.title}] 모임이 곧 시작해요. 위치 공유를 위해 GPS 권한을 허용해주세요.`,
            targetType: 'invitation',
            targetId: inv.id,
            invitationId: inv.id,
          }),
        ),
      );
    }
    return { processed: targets.length };
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
