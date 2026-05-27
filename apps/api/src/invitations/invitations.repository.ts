import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { invitations, participants } from '../database/schema';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { MemberRole } from '../common/enums/member-role.enum';
import { RsvpStatus } from '../common/enums/rsvp-status.enum';

@Injectable()
export class InvitationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

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
    return rows.map((r) => ({ ...r.invitation, myRole: r.myRole }));
  }

  findById(id: string) {
    return this.db.query.invitations.findFirst({
      where: (inv, { eq, isNull, and }) =>
        and(eq(inv.id, id), isNull(inv.deletedAt)),
      with: {
        eventLocation: true,
      },
    });
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

  async create(userId: string, dto: CreateInvitationDto) {
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

  async update(id: string, dto: UpdateInvitationDto) {
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
