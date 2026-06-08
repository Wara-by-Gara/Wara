import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull, lte, gt, inArray, lt, count } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import * as schema from '../database/schema';
import type { NewDateVotePoll, NewDateVoteSlot } from '../database/schema';

type ResponseInput = { slotId: string; response: 'good' | 'maybe' | 'bad' };

@Injectable()
export class DateVoteRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  // ── Invitation helpers ───────────────────────────────────────────────────────

  async findInvitationById(id: string) {
    const [row] = await this.db
      .select({
        id: schema.invitations.id,
        eventStartAt: schema.invitations.eventStartAt,
        title: schema.invitations.title,
      })
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.id, id),
          isNull(schema.invitations.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async findParticipantIdByUser(
    userId: string,
    invitationId: string,
  ): Promise<string | null> {
    const [row] = await this.db
      .select({ id: schema.participants.id })
      .from(schema.participants)
      .where(
        and(
          eq(schema.participants.userId, userId),
          eq(schema.participants.invitationId, invitationId),
        ),
      )
      .limit(1);
    return row?.id ?? null;
  }

  // ── Poll ────────────────────────────────────────────────────────────────────

  async createPoll(
    data: Omit<NewDateVotePoll, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ) {
    const [row] = await this.db
      .insert(schema.dateVotePolls)
      .values(data)
      .returning();
    return row!;
  }

  async findPollByInvitationId(invitationId: string) {
    const [row] = await this.db
      .select()
      .from(schema.dateVotePolls)
      .where(
        and(
          eq(schema.dateVotePolls.invitationId, invitationId),
          isNull(schema.dateVotePolls.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async findPollById(id: string) {
    const [row] = await this.db
      .select()
      .from(schema.dateVotePolls)
      .where(
        and(
          eq(schema.dateVotePolls.id, id),
          isNull(schema.dateVotePolls.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async updatePoll(
    id: string,
    data: Partial<
      Pick<
        schema.DateVotePoll,
        | 'closesAt'
        | 'isAnonymous'
        | 'status'
        | 'confirmedSlotId'
        | 'reminderSentAt'
      >
    >,
  ) {
    const [row] = await this.db
      .update(schema.dateVotePolls)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.dateVotePolls.id, id))
      .returning();
    return row!;
  }

  /** 마감 시간이 지났고 아직 open인 폴 조회 (자동 마감용) */
  async findExpiredOpenPolls() {
    return this.db
      .select()
      .from(schema.dateVotePolls)
      .where(
        and(
          eq(schema.dateVotePolls.status, 'open'),
          lt(schema.dateVotePolls.closesAt, new Date()),
          isNull(schema.dateVotePolls.deletedAt),
        ),
      );
  }

  /** 마감 25~30분 이내이고 리마인더 미발송인 open 폴 조회 (5분 크론 주기와 일치) */
  async findPollsNeedingReminder() {
    const now = Date.now();
    const twentyFiveMinutesLater = new Date(now + 25 * 60 * 1000);
    const thirtyMinutesLater = new Date(now + 30 * 60 * 1000);
    return this.db
      .select({
        id: schema.dateVotePolls.id,
        invitationId: schema.dateVotePolls.invitationId,
        invitationTitle: schema.invitations.title,
      })
      .from(schema.dateVotePolls)
      .innerJoin(
        schema.invitations,
        eq(schema.dateVotePolls.invitationId, schema.invitations.id),
      )
      .where(
        and(
          eq(schema.dateVotePolls.status, 'open'),
          gt(schema.dateVotePolls.closesAt, twentyFiveMinutesLater),
          lte(schema.dateVotePolls.closesAt, thirtyMinutesLater),
          isNull(schema.dateVotePolls.reminderSentAt),
          isNull(schema.dateVotePolls.deletedAt),
          isNull(schema.invitations.deletedAt),
        ),
      );
  }

  // ── Slots ───────────────────────────────────────────────────────────────────

  async createSlots(slots: Omit<NewDateVoteSlot, 'id' | 'createdAt'>[]) {
    return this.db.insert(schema.dateVoteSlots).values(slots).returning();
  }

  async findSlotsByPollId(pollId: string) {
    return this.db
      .select()
      .from(schema.dateVoteSlots)
      .where(eq(schema.dateVoteSlots.pollId, pollId))
      .orderBy(schema.dateVoteSlots.sortOrder, schema.dateVoteSlots.createdAt);
  }

  async findSlotById(id: string) {
    const [row] = await this.db
      .select()
      .from(schema.dateVoteSlots)
      .where(eq(schema.dateVoteSlots.id, id))
      .limit(1);
    return row ?? null;
  }

  async countSlotsByPollId(pollId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.dateVoteSlots)
      .where(eq(schema.dateVoteSlots.pollId, pollId));
    return row?.total ?? 0;
  }

  async deleteSlot(id: string) {
    await this.db
      .delete(schema.dateVoteSlots)
      .where(eq(schema.dateVoteSlots.id, id));
  }

  // ── Responses ───────────────────────────────────────────────────────────────

  /** 기존 응답 전체 삭제 후 새 응답 삽입을 하나의 트랜잭션으로 처리 (PUT semantics) */
  async replaceResponses(
    participantId: string,
    pollId: string,
    responses: ResponseInput[],
  ) {
    return this.db.transaction(async (tx) => {
      const slots = await tx
        .select({ id: schema.dateVoteSlots.id })
        .from(schema.dateVoteSlots)
        .where(eq(schema.dateVoteSlots.pollId, pollId));

      if (slots.length > 0) {
        await tx.delete(schema.dateVoteResponses).where(
          and(
            eq(schema.dateVoteResponses.participantId, participantId),
            inArray(
              schema.dateVoteResponses.slotId,
              slots.map((s) => s.id),
            ),
          ),
        );
      }

      if (responses.length === 0) return [];

      return tx
        .insert(schema.dateVoteResponses)
        .values(responses.map((r) => ({ ...r, participantId })))
        .returning();
    });
  }

  async findResponsesBySlotIds(slotIds: string[]) {
    if (slotIds.length === 0) return [];
    return this.db
      .select({
        slotId: schema.dateVoteResponses.slotId,
        participantId: schema.dateVoteResponses.participantId,
        response: schema.dateVoteResponses.response,
        userId: schema.participants.userId,
        nickname: schema.users.nickname,
      })
      .from(schema.dateVoteResponses)
      .leftJoin(
        schema.participants,
        eq(schema.dateVoteResponses.participantId, schema.participants.id),
      )
      .leftJoin(schema.users, eq(schema.participants.userId, schema.users.id))
      .where(inArray(schema.dateVoteResponses.slotId, slotIds));
  }

  async findMyResponsesByPoll(participantId: string, pollId: string) {
    const slots = await this.findSlotsByPollId(pollId);
    if (slots.length === 0) return [];
    return this.db
      .select()
      .from(schema.dateVoteResponses)
      .where(
        and(
          eq(schema.dateVoteResponses.participantId, participantId),
          inArray(
            schema.dateVoteResponses.slotId,
            slots.map((s) => s.id),
          ),
        ),
      );
  }

  /** 특정 폴에서 아직 한 번도 응답하지 않은 참가자 목록 조회 (리마인더용) */
  async findNonVotersByPoll(pollId: string) {
    const slots = await this.findSlotsByPollId(pollId);
    if (slots.length === 0) return [];

    // 해당 폴 슬롯에 응답이 1개 이상 있는 participantId 집합
    const voted = await this.db
      .selectDistinct({ participantId: schema.dateVoteResponses.participantId })
      .from(schema.dateVoteResponses)
      .where(
        inArray(
          schema.dateVoteResponses.slotId,
          slots.map((s) => s.id),
        ),
      );
    const votedIds = voted.map((v) => v.participantId);

    // 초대장의 전체 참가자 중 votedIds에 없는 참가자
    const poll = await this.findPollById(pollId);
    if (!poll) return [];

    const allParticipants = await this.db
      .select({
        id: schema.participants.id,
        userId: schema.participants.userId,
      })
      .from(schema.participants)
      .where(eq(schema.participants.invitationId, poll.invitationId));

    return votedIds.length === 0
      ? allParticipants
      : allParticipants.filter((p) => !votedIds.includes(p.id));
  }

  /** 복수 폴의 미투표자를 단일 쿼리 세트로 조회 (sendReminders 배치용) */
  async findNonVotersByPollIds(
    polls: { id: string; invitationId: string }[],
  ): Promise<{ pollId: string; userId: string }[]> {
    if (polls.length === 0) return [];

    const pollIds = polls.map((p) => p.id);
    const invitationIds = [...new Set(polls.map((p) => p.invitationId))];

    // 쿼리 1: 대상 poll의 슬롯 전체
    const allSlots = await this.db
      .select({
        id: schema.dateVoteSlots.id,
        pollId: schema.dateVoteSlots.pollId,
      })
      .from(schema.dateVoteSlots)
      .where(inArray(schema.dateVoteSlots.pollId, pollIds));

    const slotIds = allSlots.map((s) => s.id);

    //쿼리 2: 이미 응답한 participantId 집합
    const voted: { participantId: string; slotId: string }[] =
      slotIds.length > 0
        ? await this.db
            .selectDistinct({
              participantId: schema.dateVoteResponses.participantId,
              slotId: schema.dateVoteResponses.slotId,
            })
            .from(schema.dateVoteResponses)
            .where(inArray(schema.dateVoteResponses.slotId, slotIds))
        : [];

    //slotId -> pollId맵핑
    const slotToPoll = new Map(allSlots.map((s) => [s.id, s.pollId]));

    //poll별 voteIds분리
    const votedByPoll = new Map<string, Set<string>>();
    for (const v of voted) {
      const pollId = slotToPoll.get(v.slotId)!;
      if (!votedByPoll.has(pollId)) votedByPoll.set(pollId, new Set());
      votedByPoll.get(pollId)!.add(v.participantId as string);
    }

    //쿼리 3: 대상 초대장 전체 참가자
    const allParticipants = await this.db
      .select({
        id: schema.participants.id,
        userId: schema.participants.userId,
        invitationId: schema.participants.invitationId,
      })
      .from(schema.participants)
      .where(inArray(schema.participants.invitationId, invitationIds));

    //in-memory: poll별 미투표 userId
    const invitationByPoll = new Map(polls.map((p) => [p.id, p.invitationId]));
    const result: { pollId: string; userId: string }[] = [];
    for (const poll of polls) {
      const invId = invitationByPoll.get(poll.id)!;
      const votedIds = votedByPoll.get(poll.id) ?? new Set();
      for (const p of allParticipants) {
        if (p.invitationId === invId && !votedIds.has(p.id)) {
          result.push({ pollId: poll.id, userId: p.userId });
        }
      }
    }
    return result;
  }

  /** poll 확정 + invitation.eventStartAt 업데이트를 하나의 트랜잭션으로 처리 */
  async confirmPollAndUpdateInvitation(
    pollId: string,
    confirmedSlotId: string,
    invitationId: string,
    eventStartAt: Date,
  ) {
    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.dateVotePolls)
        .set({ status: 'confirmed', confirmedSlotId, updatedAt: new Date() })
        .where(eq(schema.dateVotePolls.id, pollId));

      await tx
        .update(schema.invitations)
        .set({ eventStartAt, updatedAt: new Date() })
        .where(eq(schema.invitations.id, invitationId));
    });
  }

  /** 초대장의 HOST userId 조회 */
  async findHostUserIdByInvitation(
    invitationId: string,
  ): Promise<string | null> {
    const [row] = await this.db
      .select({ userId: schema.participants.userId })
      .from(schema.participants)
      .where(
        and(
          eq(schema.participants.invitationId, invitationId),
          eq(schema.participants.memberRole, 'HOST'),
        ),
      )
      .limit(1);
    return row?.userId ?? null;
  }

  /** 초대장 전체 참가자 userId 목록 */
  async findAllParticipantUserIds(invitationId: string): Promise<string[]> {
    const rows = await this.db
      .select({ userId: schema.participants.userId })
      .from(schema.participants)
      .where(eq(schema.participants.invitationId, invitationId));
    return rows.map((r) => r.userId);
  }

  /** 복수 폴의 reminderSentAt 일괄 업데이트 */
  async updatePollsReminderSentAt(pollIds: string[]) {
    if (pollIds.length === 0) return;
    await this.db
      .update(schema.dateVotePolls)
      .set({ reminderSentAt: new Date(), updatedAt: new Date() })
      .where(inArray(schema.dateVotePolls.id, pollIds));
  }
}
