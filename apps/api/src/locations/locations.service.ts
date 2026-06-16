import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { LocationsRepository, type ParticipantLocationWithUser } from './locations.repository';
import { LocationsRedisStore, type GpsRedisValue } from './locations.redis-store';
import { LocationsGateway } from './locations.gateway';
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
    // Gateway ↔ Service 순환 의존 회피 — Gateway는 Service를 주입받음.
    @Inject(forwardRef(() => LocationsGateway))
    private readonly gateway: LocationsGateway,
  ) {}

  async getEventLocation(invitationId: string) {
    const location = await this.repository.findEventLocation(invitationId);
    if (!location) {
      throw new NotFoundException(ErrorCode.LOCATION_NOT_FOUND);
    }
    return location;
  }

  async setEventLocation(
    invitationId: string,
    dto: SetEventLocationDto,
    actorUserId: string,
  ) {
    const previous = await this.repository.findEventLocation(invitationId);
    const result = await this.repository.upsertEventLocation(invitationId, dto);

    // 최초 설정은 제외하고, 기존 장소가 실제로 '변경'된 경우에만 참가자에게 알림.
    const changed =
      !!previous &&
      (previous.placeName !== dto.placeName ||
        previous.lat !== dto.lat ||
        previous.lng !== dto.lng);
    if (changed) {
      void this.notifyEventLocationChanged(invitationId, actorUserId, dto.placeName);
    }

    return result;
  }

  // 호스트(actor) 제외 전 참가자에게 행사 장소 변경 알림. fire-and-forget.
  private async notifyEventLocationChanged(
    invitationId: string,
    actorUserId: string,
    placeName: string,
  ) {
    const userIds = await this.repository.findAllParticipantUserIds(invitationId);
    await Promise.all(
      userIds
        .filter((userId) => userId !== actorUserId)
        .map((userId) =>
          this.notifications.notify({
            userId,
            actorUserId,
            type: 'eventLocations',
            content: `행사 장소가 '${placeName}'(으)로 변경되었어요.`,
            targetType: 'invitation',
            targetId: invitationId,
            invitationId,
          }),
        ),
    );
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
    viewerUserId: string,
  ): Promise<ParticipantLocationWithUser[]> {
    // 불참(absent) 게스트가 다른 참여자의 GPS 좌표를 열람하면 개인정보 누출.
    // HOST는 모니터링 목적으로 RSVP 무관 허용.
    const viewer = await this.repository.findParticipant(viewerUserId, invitationId);
    if (!viewer) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    if (viewer.memberRole !== 'HOST' && viewer.rsvpStatus === 'absent') {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }

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
        statusMessage: value.statusMessage,
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

  // 미도착 상태메시지 설정 — 위치 공유 중인(Redis entry 존재) 참여자만 가능.
  // absent 게스트는 차단(HOST는 RSVP 무관 허용 — 호스트 본인 상태도 공유 대상).
  async updateMyStatusMessage(
    invitationId: string,
    userId: string,
    message: string,
  ): Promise<{
    participantId: string;
    statusMessage: string;
    updatedAt: Date;
  }> {
    const participant = await this.repository.findParticipant(userId, invitationId);
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    if (participant.memberRole !== 'HOST' && participant.rsvpStatus === 'absent') {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }

    const previous = await this.redisStore.findOne(invitationId, participant.id);
    if (!previous) {
      // 위치 공유 OFF — 상태메시지는 GPS와 같은 lifecycle이므로 entry 필수.
      throw new NotFoundException(ErrorCode.LOCATION_NOT_FOUND);
    }

    const now = new Date();
    await this.redisStore.upsert(invitationId, participant.id, {
      ...previous,
      statusMessage: message,
      updatedAt: now.toISOString(),
    });

    this.gateway.emitStatusMessageUpdated(invitationId, participant.id, message, now);

    return { participantId: participant.id, statusMessage: message, updatedAt: now };
  }

  async deleteMyStatusMessage(
    invitationId: string,
    userId: string,
  ): Promise<{ participantId: string }> {
    const participant = await this.repository.findParticipant(userId, invitationId);
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }

    const previous = await this.redisStore.findOne(invitationId, participant.id);
    // 위치 공유 OFF거나 이미 null이면 idempotent — broadcast 없이 종료.
    if (!previous || previous.statusMessage === null) {
      return { participantId: participant.id };
    }

    await this.redisStore.upsert(invitationId, participant.id, {
      ...previous,
      statusMessage: null,
      updatedAt: new Date().toISOString(),
    });

    this.gateway.emitStatusMessageRemoved(invitationId, participant.id);

    return { participantId: participant.id };
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
    // 다른 클라이언트에 즉시 marker 제거 알림. 정리는 Redis에서 끝났으므로 emit만.
    for (const { invitationId, participantId } of pairs) {
      this.gateway.emitLocationRemoved(invitationId, participantId);
    }
  }

  // 게스트가 초대장에서 나가거나 호스트가 kick할 때 호출 — 해당 participant의 GPS 정리 + broadcast.
  // ParticipantsService.leave에서 호출. 미정리 시 24h TTL까지 stale 좌표 노출.
  async cleanupParticipantGpsData(
    invitationId: string,
    participantId: string,
  ): Promise<void> {
    await this.redisStore.deleteParticipant(invitationId, participantId);
    this.gateway.emitLocationRemoved(invitationId, participantId);
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
    this.gateway.emitLocationRemoved(invitationId, participant.id);
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
      // 위치 업데이트 시 기존 상태메시지 유지 — 둘은 독립적으로 갱신.
      statusMessage: previous?.statusMessage ?? null,
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
      statusMessage: previous?.statusMessage ?? null,
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
            content: `[${inv.title}] 15분 뒤 모임이 시작돼요. 위치 공유를 켜고 출발 상황을 함께 확인해보세요.`,
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
