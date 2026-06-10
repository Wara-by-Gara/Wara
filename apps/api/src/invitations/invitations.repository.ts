import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { dateVotePolls, eventLocations, invitations, participants, users } from '../database/schema';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { ListPublicInvitationsDto } from './dto/list-public-invitations.dto';
import { MemberRole } from '../common/enums/member-role.enum';
import { RsvpStatus } from '../common/enums/rsvp-status.enum';

const PARTICIPANT_PREVIEW_LIMIT = 3;

export type ParticipantPreviewRow = {
  invitationId: string;
  userId: string;
  name: string | null;
  profileImageUrl: string | null;
  memberRole: 'HOST' | 'GUEST';
};

export type ParticipantPreviewBundle = {
  total: number;
  previews: ParticipantPreviewRow[];
};

@Injectable()
export class InvitationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findPublicExplore(dto: ListPublicInvitationsDto) {
    const pageLimit = dto.limit ?? 20;
    const fetchLimit = pageLimit + 1;

    const conditions = [
      eq(invitations.isPublic, true),
      isNull(invitations.deletedAt),
      eq(invitations.status, 'active'),
    ];
    if (dto.category) {
      conditions.push(eq(invitations.category, dto.category));
    }
    if (dto.cursor) {
      conditions.push(
        sql`(${invitations.eventStartAt}, ${invitations.createdAt}, ${invitations.id}) < (
          SELECT ${invitations.eventStartAt}, ${invitations.createdAt}, ${invitations.id}
          FROM ${invitations}
          WHERE ${invitations.id} = ${dto.cursor}
          LIMIT 1
        )`,
      );
    }

    const rows = await this.db.query.invitations.findMany({
      where: and(...conditions),
      with: {
        eventLocation: true,
        host: {
          columns: { name: true, nickname: true, profileImageUrl: true },
        },
      },
      orderBy: [
        desc(invitations.eventStartAt),
        desc(invitations.createdAt),
        desc(invitations.id),
      ],
      limit: fetchLimit,
    });

    const hasNext = rows.length > pageLimit;
    const paged = hasNext ? rows.slice(0, pageLimit) : rows;

    return {
      rows: paged,
      nextCursor: hasNext && paged.length > 0 ? paged.at(-1)!.id : null,
    };
  }

  async countPublicParticipantsByInvitationIds(
    invitationIds: string[],
  ): Promise<Map<string, number>> {
    if (invitationIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        invitationId: participants.invitationId,
        count: sql<number>`count(*)::int`,
      })
      .from(participants)
      .where(
        and(
          inArray(participants.invitationId, invitationIds),
          ne(participants.rsvpStatus, RsvpStatus.ABSENT),
        ),
      )
      .groupBy(participants.invitationId);
    return new Map(rows.map((r) => [r.invitationId, r.count]));
  }

  async findAllByUserId(userId: string) {
    const rows = await this.db
      .select({
        invitation: invitations,
        myRole: participants.memberRole,
      })
      .from(participants)
      .innerJoin(invitations, eq(participants.invitationId, invitations.id))
      .where(
        and(
          eq(participants.userId, userId),
          isNull(invitations.deletedAt),
        ),
      )
      .orderBy(desc(invitations.createdAt));

    const invitationIds = rows.map((r) => r.invitation.id);
    if (invitationIds.length === 0) return [];

    const locations = await this.db
      .select()
      .from(eventLocations)
      .where(
        and(
          inArray(eventLocations.invitationId, invitationIds),
          isNull(eventLocations.deletedAt),
        ),
      );
    const locationByInvitationId = new Map(
      locations.map((loc) => [loc.invitationId, loc]),
    );

    return rows.map((r) => ({
      ...r.invitation,
      myRole: r.myRole,
      eventLocation: locationByInvitationId.get(r.invitation.id) ?? null,
    }));
  }

  async findParticipantPreviewsByInvitationIds(
    invitationIds: string[],
  ): Promise<Map<string, ParticipantPreviewBundle>> {
    if (invitationIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        invitationId: participants.invitationId,
        userId: users.id,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
        memberRole: participants.memberRole,
      })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          inArray(participants.invitationId, invitationIds),
          isNull(users.deletedAt),
          ne(participants.rsvpStatus, RsvpStatus.ABSENT),
        ),
      );

    const grouped = new Map<string, ParticipantPreviewRow[]>();
    for (const row of rows) {
      const list = grouped.get(row.invitationId) ?? [];
      list.push(row);
      grouped.set(row.invitationId, list);
    }

    const result = new Map<string, ParticipantPreviewBundle>();
    for (const [invitationId, members] of grouped) {
      const sorted = [...members].sort((a, b) => {
        const aIsHost = a.memberRole === MemberRole.HOST ? 0 : 1;
        const bIsHost = b.memberRole === MemberRole.HOST ? 0 : 1;
        return aIsHost - bIsHost;
      });
      result.set(invitationId, {
        total: sorted.length,
        previews: sorted.slice(0, PARTICIPANT_PREVIEW_LIMIT),
      });
    }

    return result;
  }

  findById(id: string) {
    return this.db.query.invitations.findFirst({
      where: (inv, { eq, isNull, and }) =>
        and(eq(inv.id, id), isNull(inv.deletedAt)),
      with: {
        eventLocation: true,
        host: {
          columns: {
            name: true,
            nickname: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }

  async findDateVotePollStatus(
    invitationId: string,
  ): Promise<'open' | 'closed' | 'confirmed' | null> {
    const poll = await this.db.query.dateVotePolls.findFirst({
      where: and(
        eq(dateVotePolls.invitationId, invitationId),
        isNull(dateVotePolls.deletedAt),
      ),
      columns: { status: true },
    });
    return poll?.status ?? null;
  }

  async countGuests(invitationId: string): Promise<number> {
    const rows = await this.db
      .select({ id: participants.id })
      .from(participants)
      .where(
        and(
          eq(participants.invitationId, invitationId),
          eq(participants.memberRole, MemberRole.GUEST),
          ne(participants.rsvpStatus, RsvpStatus.ABSENT),
        ),
      );
    return rows.length;
  }

  async create(userId: string, dto: CreateInvitationDto & { mainCoverType: 'image' | 'gif' }) {
    return this.db.transaction(async (tx) => {
      const result = await tx
        .insert(invitations)
        .values({ ...dto, userId })
        .returning();
      const invitation = result[0];
      if (!invitation) throw new Error('초대장 생성 실패');

      await tx.insert(participants).values({
        userId,
        invitationId: invitation.id,
        memberRole: MemberRole.HOST,
        rsvpStatus: RsvpStatus.ATTENDING,
      });

      return invitation;
    });
  }

  async update(id: string, dto: Omit<UpdateInvitationDto, 'mainImageKey' | 'mainGifUrl'> & { mainImageKey?: string | null; mainGifUrl?: string | null; mainCoverType?: 'image' | 'gif' }) {
    const [updated] = await this.db
      .update(invitations)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(invitations.id, id), isNull(invitations.deletedAt)))
      .returning();
    return updated;
  }

  async remove(id: string) {
    await this.db
      .update(invitations)
      .set({ deletedAt: new Date() })
      .where(and(eq(invitations.id, id), isNull(invitations.deletedAt)));
  }
}
