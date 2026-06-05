import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, ne, notInArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { invitations, participants, users } from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

@Injectable()
export class FriendsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  // 내가 참여한 초대에 함께 참여한 다른 사용자들의 (초대 단위) 행.
  // 서비스에서 friendUserId 기준으로 그룹 집계한다.
  async findCoParticipationRows(myUserId: string) {
    const myParticipation = alias(participants, 'my_p');
    const friendParticipation = alias(participants, 'friend_p');

    return this.db
      .select({
        friendUserId: friendParticipation.userId,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
        invitationId: invitations.id,
        title: invitations.title,
        eventStartAt: invitations.eventStartAt,
      })
      .from(myParticipation)
      .innerJoin(
        friendParticipation,
        and(
          eq(friendParticipation.invitationId, myParticipation.invitationId),
          ne(friendParticipation.userId, myUserId),
        ),
      )
      .innerJoin(invitations, eq(invitations.id, myParticipation.invitationId))
      .innerJoin(users, eq(users.id, friendParticipation.userId))
      .where(
        and(
          eq(myParticipation.userId, myUserId),
          isNull(users.deletedAt),
          isNull(invitations.deletedAt),
        ),
      );
  }

  // 나와 대상이 함께 참여한 초대에 같이 있는 (나·대상 제외) 사용자들.
  // 중복 userId가 나올 수 있어 서비스에서 dedupe한다.
  async findMutual(myUserId: string, targetUserId: string) {
    const p1 = alias(participants, 'p1');
    const p2 = alias(participants, 'p2');

    const sharedRows = await this.db
      .selectDistinct({ invitationId: p1.invitationId })
      .from(p1)
      .innerJoin(p2, eq(p1.invitationId, p2.invitationId))
      .innerJoin(invitations, eq(invitations.id, p1.invitationId))
      .where(
        and(
          eq(p1.userId, myUserId),
          eq(p2.userId, targetUserId),
          isNull(invitations.deletedAt),
        ),
      );

    if (sharedRows.length === 0) return [];

    const sharedIds = sharedRows.map((r) => r.invitationId);
    return this.db
      .select({
        userId: participants.userId,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
      })
      .from(participants)
      .innerJoin(users, eq(users.id, participants.userId))
      .where(
        and(
          inArray(participants.invitationId, sharedIds),
          notInArray(participants.userId, [myUserId, targetUserId]),
          isNull(users.deletedAt),
        ),
      );
  }

  // 나와 대상이 함께 참여한 초대 목록 (최신 이벤트 순).
  async findSharedInvitations(myUserId: string, targetUserId: string) {
    const p1 = alias(participants, 'p1');
    const p2 = alias(participants, 'p2');

    return this.db
      .select({
        id: invitations.id,
        title: invitations.title,
        eventStartAt: invitations.eventStartAt,
        mainImageKey: invitations.mainImageKey,
      })
      .from(invitations)
      .innerJoin(
        p1,
        and(eq(p1.invitationId, invitations.id), eq(p1.userId, myUserId)),
      )
      .innerJoin(
        p2,
        and(eq(p2.invitationId, invitations.id), eq(p2.userId, targetUserId)),
      )
      .where(isNull(invitations.deletedAt))
      .orderBy(desc(invitations.eventStartAt));
  }

  async findUserBasic(userId: string) {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }
}
