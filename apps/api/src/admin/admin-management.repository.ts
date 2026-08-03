import { Injectable, Inject } from '@nestjs/common';
import { and, eq, or, ilike, isNull, isNotNull, desc, count, inArray } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import * as schema from '../database/schema';

type UserStatus = 'active' | 'suspended' | 'withdrawn';
type InvitationStatus = 'active' | 'closed';

@Injectable()
export class AdminManagementRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  // ── Users ─────────────────────────────────────────────────────────────────────

  private userStatusCond(status: UserStatus | undefined) {
    if (status === 'withdrawn') return isNotNull(schema.users.deletedAt);
    if (status === 'suspended') return and(isNull(schema.users.deletedAt), isNotNull(schema.users.suspendedAt));
    if (status === 'active') return and(isNull(schema.users.deletedAt), isNull(schema.users.suspendedAt));
    return undefined;
  }

  async listUsers(query: string | undefined, status: UserStatus | undefined, limit: number, offset: number) {
    const search = query
      ? or(
          ilike(schema.users.name, `%${query}%`),
          ilike(schema.users.email, `%${query}%`),
          ilike(schema.users.nickname, `%${query}%`),
        )
      : undefined;
    const where = and(this.userStatusCond(status), search);

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          name: schema.users.name,
          nickname: schema.users.nickname,
          profileImageUrl: schema.users.profileImageUrl,
          role: schema.users.role,
          suspendedAt: schema.users.suspendedAt,
          deletedAt: schema.users.deletedAt,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .where(where)
        .orderBy(desc(schema.users.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.users).where(where),
    ]);
    return { rows, total: totalRow?.total ?? 0 };
  }

  async findUserById(id: string) {
    const [row] = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return row ?? null;
  }

  async countHostedActive(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.participants)
      .innerJoin(schema.invitations, eq(schema.participants.invitationId, schema.invitations.id))
      .where(
        and(
          eq(schema.participants.userId, userId),
          eq(schema.participants.memberRole, 'HOST'),
          eq(schema.invitations.status, 'active'),
          isNull(schema.invitations.deletedAt),
        ),
      );
    return row?.total ?? 0;
  }

  async countParticipations(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.participants)
      .where(eq(schema.participants.userId, userId));
    return row?.total ?? 0;
  }

  async getSocialProvidersByUserIds(userIds: string[]): Promise<Map<string, string[]>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.db
      .select({ userId: schema.socialAccounts.userId, provider: schema.socialAccounts.provider })
      .from(schema.socialAccounts)
      .where(inArray(schema.socialAccounts.userId, userIds));
    const map = new Map<string, string[]>();
    for (const row of rows) {
      const list = map.get(row.userId) ?? [];
      list.push(row.provider);
      map.set(row.userId, list);
    }
    return map;
  }

  async getSocialAccountsByUserId(userId: string): Promise<{ provider: string; createdAt: Date }[]> {
    return await this.db
      .select({ provider: schema.socialAccounts.provider, createdAt: schema.socialAccounts.createdAt })
      .from(schema.socialAccounts)
      .where(eq(schema.socialAccounts.userId, userId));
  }

  async countHostedTotal(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.participants)
      .innerJoin(schema.invitations, eq(schema.participants.invitationId, schema.invitations.id))
      .where(
        and(
          eq(schema.participants.userId, userId),
          eq(schema.participants.memberRole, 'HOST'),
          isNull(schema.invitations.deletedAt),
        ),
      );
    return row?.total ?? 0;
  }

  async countGuestParticipations(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.participants)
      .where(and(eq(schema.participants.userId, userId), eq(schema.participants.memberRole, 'GUEST')));
    return row?.total ?? 0;
  }

  async setUserRole(id: string, role: 'admin' | 'member', actorId: string) {
    const [row] = await this.db
      .update(schema.users)
      .set({
        role,
        updatedAt: new Date(),
        ...(role === 'admin'
          ? { promotedBy: actorId, promotedAt: new Date() }
          : { promotedBy: null, promotedAt: null }),
      })
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id, role: schema.users.role });
    return row ?? null;
  }

  async findNicknameById(id: string): Promise<string | null> {
    const [row] = await this.db
      .select({ nickname: schema.users.nickname })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return row?.nickname ?? null;
  }

  async setUserSuspension(id: string, suspendedAt: Date | null, reason: string | null) {
    const [row] = await this.db
      .update(schema.users)
      .set({ suspendedAt, suspendedReason: reason, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id, suspendedAt: schema.users.suspendedAt });
    return row ?? null;
  }

  // ── Invitations ─────────────────────────────────────────────────────────────

  async listInvitations(query: string | undefined, status: InvitationStatus | undefined, limit: number, offset: number) {
    const search = query ? ilike(schema.invitations.title, `%${query}%`) : undefined;
    const where = and(
      isNull(schema.invitations.deletedAt),
      status ? eq(schema.invitations.status, status) : undefined,
      search,
    );

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: schema.invitations.id,
          title: schema.invitations.title,
          status: schema.invitations.status,
          eventStartAt: schema.invitations.eventStartAt,
          createdAt: schema.invitations.createdAt,
        })
        .from(schema.invitations)
        .where(where)
        .orderBy(desc(schema.invitations.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(schema.invitations).where(where),
    ]);
    return { rows, total: totalRow?.total ?? 0 };
  }

  async findInvitationById(id: string) {
    const [row] = await this.db
      .select()
      .from(schema.invitations)
      .where(and(eq(schema.invitations.id, id), isNull(schema.invitations.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  async countParticipants(invitationId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.participants)
      .where(eq(schema.participants.invitationId, invitationId));
    return row?.total ?? 0;
  }

  async setInvitationStatus(id: string, status: InvitationStatus) {
    const [row] = await this.db
      .update(schema.invitations)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.invitations.id, id))
      .returning({ id: schema.invitations.id, status: schema.invitations.status });
    return row ?? null;
  }

  async softDeleteInvitation(id: string) {
    await this.db
      .update(schema.invitations)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.invitations.id, id));
  }
}
