import { Injectable, Inject } from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { dateVotePolls, eventLocations, invitations, participants, users } from '../database/schema';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { ListPublicInvitationsDto } from './dto/list-public-invitations.dto';
import { ListPublicMapInvitationsDto } from './dto/list-public-map-invitations.dto';
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

    const sort = dto.sort ?? 'latest';

    const conditions = [
      eq(invitations.isPublic, true),
      isNull(invitations.deletedAt),
      eq(invitations.status, 'active'),
    ];
    if (dto.category) {
      conditions.push(eq(invitations.category, dto.category));
    }
    if (dto.q) {
      // 제목 부분 검색 (대소문자 무시)
      conditions.push(sql`${invitations.title} ILIKE ${'%' + dto.q + '%'}`);
    }
    // 마감순은 일정이 정해진 초대장만 대상
    if (sort === 'deadline') {
      conditions.push(sql`${invitations.eventStartAt} IS NOT NULL`);
    }

    // 정렬별 keyset 튜플: (정렬키, id). cursor row의 동일 튜플과 비교.
    const sortColumn = {
      latest: invitations.createdAt,
      deadline: invitations.eventStartAt,
      views: invitations.viewCount,
    }[sort];
    const orderBy =
      sort === 'deadline'
        ? [asc(invitations.eventStartAt), asc(invitations.id)]
        : [desc(sortColumn), desc(invitations.id)];

    if (dto.cursor) {
      const op = sort === 'deadline' ? sql`>` : sql`<`;
      conditions.push(
        sql`(${sortColumn}, ${invitations.id}) ${op} (
          SELECT ${sortColumn}, ${invitations.id}
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
      orderBy,
      limit: fetchLimit,
    });

    const hasNext = rows.length > pageLimit;
    const paged = hasNext ? rows.slice(0, pageLimit) : rows;

    return {
      rows: paged,
      nextCursor: hasNext && paged.length > 0 ? paged.at(-1)!.id : null,
    };
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.db
      .update(invitations)
      .set({ viewCount: sql`${invitations.viewCount} + 1` })
      .where(and(eq(invitations.id, id), isNull(invitations.deletedAt)));
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

  async findPublicForMap(dto: ListPublicMapInvitationsDto) {
    const conditions = [
      eq(invitations.isPublic, true),
      isNull(invitations.deletedAt),
      eq(invitations.status, 'active'),
      isNull(eventLocations.deletedAt),
      sql`${eventLocations.lat} BETWEEN ${dto.swLat} AND ${dto.neLat}`,
      sql`${eventLocations.lng} BETWEEN ${dto.swLng} AND ${dto.neLng}`,
    ];
    if (dto.category) {
      conditions.push(eq(invitations.category, dto.category));
    }

    return this.db
      .select({
        id: invitations.id,
        title: invitations.title,
        category: invitations.category,
        eventStartAt: invitations.eventStartAt,
        mainImageKey: invitations.mainImageKey,
        mainImageThumbnailKey: invitations.mainImageThumbnailKey,
        lat: eventLocations.lat,
        lng: eventLocations.lng,
      })
      .from(invitations)
      .innerJoin(
        eventLocations,
        eq(eventLocations.invitationId, invitations.id),
      )
      .where(and(...conditions))
      .limit(dto.limit);
  }

  private async findByUserId(userId: string, isHidden: boolean) {
    const rows = await this.db
      .select({
        invitation: invitations,
        myRole: participants.memberRole,
        myRsvpStatus: participants.rsvpStatus,
      })
      .from(participants)
      .innerJoin(invitations, eq(participants.invitationId, invitations.id))
      .where(
        and(
          eq(participants.userId, userId),
          isNull(invitations.deletedAt),
          eq(participants.isHidden, isHidden),
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
      myRsvpStatus: r.myRsvpStatus,
      eventLocation: locationByInvitationId.get(r.invitation.id) ?? null,
    }));
  }

  findAllByUserId(userId: string) {
    return this.findByUserId(userId, false);
  }

  findHiddenByUserId(userId: string) {
    return this.findByUserId(userId, true);
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

  async create(userId: string, dto: Omit<CreateInvitationDto, 'accessPassword'> & { mainCoverType: 'image' | 'gif'; accessPasswordHash?: string | null }) {
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

  /**
   * 초대장 복제 — 디자인/문구/RSVP/옵션을 복사해 새 초대장(active) 생성.
   * 일정(eventStartAt)·참석자·조회수·공개여부는 초기화. 호출자가 새 HOST.
   */
  async clone(sourceId: string, userId: string) {
    return this.db.transaction(async (tx) => {
      const source = await tx.query.invitations.findFirst({
        where: (t, { eq, and, isNull }) =>
          and(eq(t.id, sourceId), isNull(t.deletedAt)),
      });
      if (!source) return null;

      const [invitation] = await tx
        .insert(invitations)
        .values({
          userId,
          templateId: source.templateId,
          status: 'active',
          title: `${source.title} (복사본)`,
          description: source.description,
          mainCoverType: source.mainCoverType,
          mainImageKey: source.mainImageKey,
          mainImageThumbnailKey: source.mainImageThumbnailKey,
          mainGifUrl: source.mainGifUrl,
          isMissionEnabled: source.isMissionEnabled,
          bgColor: source.bgColor,
          font: source.font,
          rsvpAttendingEmoji: source.rsvpAttendingEmoji,
          rsvpAttendingLabel: source.rsvpAttendingLabel,
          rsvpMaybeEmoji: source.rsvpMaybeEmoji,
          rsvpMaybeLabel: source.rsvpMaybeLabel,
          rsvpDeclinedEmoji: source.rsvpDeclinedEmoji,
          rsvpDeclinedLabel: source.rsvpDeclinedLabel,
          animation: source.animation,
          fee: source.fee,
          dressCode: source.dressCode,
          parkingInfo: source.parkingInfo,
          // 일정·공개·카테고리는 초기화 (새 모임 기준)
          isPublic: false,
        })
        .returning();
      if (!invitation) throw new Error('초대장 복제 실패');

      await tx.insert(participants).values({
        userId,
        invitationId: invitation.id,
        memberRole: MemberRole.HOST,
        rsvpStatus: RsvpStatus.ATTENDING,
      });

      return invitation;
    });
  }

  async update(id: string, dto: Omit<UpdateInvitationDto, 'mainImageKey' | 'mainGifUrl' | 'accessPassword'> & { mainImageKey?: string | null; mainGifUrl?: string | null; mainCoverType?: 'image' | 'gif'; accessPasswordHash?: string | null }) {
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

  findCoverById(id: string) {
    return this.db.query.invitations.findFirst({
      where: (inv, { eq, isNull, and }) =>
        and(eq(inv.id, id), isNull(inv.deletedAt)),
      columns: {
        mainCoverType: true,
        mainGifUrl: true,
        mainImageKey: true,
      },
    });
  }

  async updateMainImageThumbnailKey(id: string, thumbnailKey: string): Promise<void> {
    await this.db
      .update(invitations)
      .set({ mainImageThumbnailKey: thumbnailKey, updatedAt: new Date() })
      .where(eq(invitations.id, id));
  }
}
