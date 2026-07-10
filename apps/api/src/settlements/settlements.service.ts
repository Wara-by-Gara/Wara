import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { ulid } from 'ulid';
import { SettlementsRepository } from './settlements.repository';
import { ErrorCode } from '../common/constants/error-codes';
import { computeNet, minTransfers, equalSplit, type ExpenseForCalc } from './settlement-calc.util';
import type { UpsertExpenseDto } from './dto/upsert-expense.dto';
import type { Participant } from '../database/schema';

interface ParticipantRow {
  participantId: string;
  userId: string;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

export interface SettlementSummary {
  status: 'open' | 'confirmed';
  isAnonymized: boolean;
  shareEnabled: boolean;
  total: number;
  expenses: {
    id: string;
    title: string;
    amount: number;
    splitType: 'equal' | 'custom';
    payer: { participantId: string; displayName: string };
    shares: { participantId: string; displayName: string; share: number }[];
    createdAt: string;
  }[];
  balances: { participantId: string; displayName: string; net: number }[];
  transfers: { from: string; fromName: string; to: string; toName: string; amount: number }[];
}

@Injectable()
export class SettlementsService {
  constructor(private readonly repo: SettlementsRepository) {}

  // ── 조회 ──────────────────────────────────────────────────────────────────────

  async getSummary(invitationId: string): Promise<SettlementSummary> {
    const settlement = await this.repo.getOrCreate(invitationId);
    const participants = await this.repo.findParticipants(invitationId);
    return this.buildSummary(settlement, participants, false);
  }

  async getPublicSummary(token: string): Promise<SettlementSummary> {
    const settlement = await this.repo.findByShareToken(token);
    if (!settlement || !settlement.shareToken) {
      throw new NotFoundException(ErrorCode.SETTLEMENT_SHARE_DISABLED);
    }
    const participants = await this.repo.findParticipants(settlement.invitationId);
    return this.buildSummary(settlement, participants, settlement.isAnonymized);
  }

  // ── 항목 CRUD ─────────────────────────────────────────────────────────────────

  async addExpense(invitationId: string, dto: UpsertExpenseDto) {
    const settlement = await this.repo.getOrCreate(invitationId);
    this.assertOpen(settlement.status);
    const participants = await this.repo.findParticipants(invitationId);
    const shares = this.resolveShares(dto, participants);

    return this.repo.createExpenseWithShares(
      settlement.id,
      { payerParticipantId: dto.payerParticipantId, title: dto.title, amount: dto.amount, splitType: dto.splitType },
      shares,
    );
  }

  async updateExpense(invitationId: string, expenseId: string, dto: UpsertExpenseDto, viewer: Participant) {
    const settlement = await this.repo.getOrCreate(invitationId);
    this.assertOpen(settlement.status);
    const expense = await this.loadOwnedExpense(settlement.id, expenseId, viewer);

    const participants = await this.repo.findParticipants(invitationId);
    const shares = this.resolveShares(dto, participants);

    return this.repo.replaceExpenseWithShares(
      expense.id,
      { payerParticipantId: dto.payerParticipantId, title: dto.title, amount: dto.amount, splitType: dto.splitType },
      shares,
    );
  }

  async deleteExpense(invitationId: string, expenseId: string, viewer: Participant) {
    const settlement = await this.repo.getOrCreate(invitationId);
    this.assertOpen(settlement.status);
    const expense = await this.loadOwnedExpense(settlement.id, expenseId, viewer);
    await this.repo.softDeleteExpense(expense.id);
  }

  // ── 상태 / 공유 ─────────────────────────────────────────────────────────────────

  async confirm(invitationId: string) {
    const settlement = await this.repo.getOrCreate(invitationId);
    return this.repo.updateSettlement(settlement.id, { status: 'confirmed' });
  }

  async reopen(invitationId: string) {
    const settlement = await this.repo.getOrCreate(invitationId);
    return this.repo.updateSettlement(settlement.id, { status: 'open' });
  }

  async setAnonymized(invitationId: string, isAnonymized: boolean) {
    const settlement = await this.repo.getOrCreate(invitationId);
    return this.repo.updateSettlement(settlement.id, { isAnonymized });
  }

  /** 공유 활성화 — 토큰 없으면 생성해 반환. */
  async enableShare(invitationId: string) {
    const settlement = await this.repo.getOrCreate(invitationId);
    const token = settlement.shareToken ?? ulid();
    const updated = settlement.shareToken
      ? settlement
      : await this.repo.updateSettlement(settlement.id, { shareToken: token });
    return { shareToken: updated.shareToken! };
  }

  async disableShare(invitationId: string) {
    const settlement = await this.repo.getOrCreate(invitationId);
    await this.repo.updateSettlement(settlement.id, { shareToken: null });
  }

  // ── 내부 헬퍼 ────────────────────────────────────────────────────────────────────

  private assertOpen(status: 'open' | 'confirmed') {
    if (status === 'confirmed') {
      throw new UnprocessableEntityException(ErrorCode.SETTLEMENT_CONFIRMED);
    }
  }

  private async loadOwnedExpense(settlementId: string, expenseId: string, viewer: Participant) {
    const expense = await this.repo.findExpenseById(expenseId);
    if (!expense || expense.settlementId !== settlementId) {
      throw new NotFoundException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND);
    }
    // HOST(공동 호스트 포함) 또는 지불자 본인만 수정/삭제 가능.
    const canManage = viewer.memberRole === 'HOST' || expense.payerParticipantId === viewer.id;
    if (!canManage) throw new ForbiddenException(ErrorCode.SETTLEMENT_FORBIDDEN);
    return expense;
  }

  /** dto → 저장할 share 목록. 참가자 검증 + equal 균등 분배. */
  private resolveShares(dto: UpsertExpenseDto, participants: ParticipantRow[]): { participantId: string; share: number }[] {
    const validIds = new Set(participants.map((p) => p.participantId));
    if (!validIds.has(dto.payerParticipantId)) {
      throw new BadRequestException(ErrorCode.SETTLEMENT_PARTICIPANT_INVALID);
    }

    if (dto.splitType === 'equal') {
      const ids = dto.participantIds!;
      if (ids.some((id) => !validIds.has(id))) {
        throw new BadRequestException(ErrorCode.SETTLEMENT_PARTICIPANT_INVALID);
      }
      const split = equalSplit(dto.amount, ids);
      return [...split.entries()].map(([participantId, share]) => ({ participantId, share }));
    }

    const shares = dto.shares!;
    if (shares.some((s) => !validIds.has(s.participantId))) {
      throw new BadRequestException(ErrorCode.SETTLEMENT_PARTICIPANT_INVALID);
    }
    return shares.map((s) => ({ participantId: s.participantId, share: s.share }));
  }

  private async buildSummary(
    settlement: { status: 'open' | 'confirmed'; isAnonymized: boolean; shareToken: string | null; id: string },
    participants: ParticipantRow[],
    anonymize: boolean,
  ): Promise<SettlementSummary> {
    const expenses = await this.repo.findExpenses(settlement.id);
    const shares = await this.repo.findSharesByExpenseIds(expenses.map((e) => e.id));

    // participantId → 표시 이름 (익명화 시 '참가자 A/B/…')
    const nameMap = new Map<string, string>();
    participants.forEach((p, i) => {
      nameMap.set(
        p.participantId,
        anonymize ? `참가자 ${String.fromCharCode(65 + (i % 26))}` : (p.name ?? p.nickname ?? '참가자'),
      );
    });
    const nameOf = (id: string) => nameMap.get(id) ?? '참가자';

    const sharesByExpense = new Map<string, { participantId: string; share: number }[]>();
    for (const s of shares) {
      const list = sharesByExpense.get(s.expenseId) ?? [];
      list.push({ participantId: s.participantId, share: s.share });
      sharesByExpense.set(s.expenseId, list);
    }

    const expensesForCalc: ExpenseForCalc[] = expenses.map((e) => ({
      payerParticipantId: e.payerParticipantId,
      amount: e.amount,
      shares: sharesByExpense.get(e.id) ?? [],
    }));

    const net = computeNet(expensesForCalc);
    const transfers = minTransfers(net);

    return {
      status: settlement.status,
      isAnonymized: settlement.isAnonymized,
      shareEnabled: settlement.shareToken !== null,
      total: expenses.reduce((acc, e) => acc + e.amount, 0),
      expenses: expenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        splitType: e.splitType,
        payer: { participantId: e.payerParticipantId, displayName: nameOf(e.payerParticipantId) },
        shares: (sharesByExpense.get(e.id) ?? []).map((s) => ({
          participantId: s.participantId,
          displayName: nameOf(s.participantId),
          share: s.share,
        })),
        createdAt: e.createdAt.toISOString(),
      })),
      balances: [...net.entries()].map(([participantId, netAmount]) => ({
        participantId,
        displayName: nameOf(participantId),
        net: netAmount,
      })),
      transfers: transfers.map((t) => ({
        from: t.from,
        fromName: nameOf(t.from),
        to: t.to,
        toName: nameOf(t.to),
        amount: t.amount,
      })),
    };
  }
}
