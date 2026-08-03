import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminManagementRepository } from './admin-management.repository';
import { ErrorCode } from '../common/constants/error-codes';
import type { ListUsersDto, ListInvitationsDto, UpdateUserRoleDto } from './dto/admin-management.dto';

@Injectable()
export class AdminManagementService {
  constructor(private readonly repo: AdminManagementRepository) {}

  // ── Users ─────────────────────────────────────────────────────────────────────

  async listUsers(dto: ListUsersDto) {
    const { rows, total } = await this.repo.listUsers(dto.query, dto.status, dto.limit, dto.offset);
    const userIds = rows.map((r) => r.id);
    const providersMap = await this.repo.getSocialProvidersByUserIds(userIds);
    const users = rows.map((r) => ({ ...r, providers: providersMap.get(r.id) ?? [] }));
    return { users, total, limit: dto.limit, offset: dto.offset };
  }

  async getUser(id: string) {
    const user = await this.repo.findUserById(id);
    if (!user) throw new NotFoundException(ErrorCode.AUTH_USER_NOT_FOUND);
    const [hostedActive, hostedTotal, guestCount, participations, socialAccounts, promotedByNickname] = await Promise.all([
      this.repo.countHostedActive(id),
      this.repo.countHostedTotal(id),
      this.repo.countGuestParticipations(id),
      this.repo.countParticipations(id),
      this.repo.getSocialAccountsByUserId(id),
      user.promotedBy ? this.repo.findNicknameById(user.promotedBy) : Promise.resolve(null),
    ]);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      promotedBy: user.promotedBy,
      promotedAt: user.promotedAt,
      promotedByNickname,
      socialAccounts,
      stats: { hostedActive, hostedTotal, guestCount, participations },
    };
  }

  async suspendUser(id: string, reason: string | null) {
    const row = await this.repo.setUserSuspension(id, new Date(), reason);
    if (!row) throw new NotFoundException(ErrorCode.AUTH_USER_NOT_FOUND);
    return { id: row.id, suspendedAt: row.suspendedAt };
  }

  async unsuspendUser(id: string) {
    const row = await this.repo.setUserSuspension(id, null, null);
    if (!row) throw new NotFoundException(ErrorCode.AUTH_USER_NOT_FOUND);
    return { id: row.id, suspendedAt: row.suspendedAt };
  }

  async updateUserRole(id: string, role: UpdateUserRoleDto['role'], actorId: string) {
    const row = await this.repo.setUserRole(id, role, actorId);
    if (!row) throw new NotFoundException(ErrorCode.AUTH_USER_NOT_FOUND);
    return { id: row.id, role: row.role };
  }

  // ── Invitations ─────────────────────────────────────────────────────────────

  async listInvitations(dto: ListInvitationsDto) {
    const { rows, total } = await this.repo.listInvitations(dto.query, dto.status, dto.limit, dto.offset);
    return { invitations: rows, total, limit: dto.limit, offset: dto.offset };
  }

  async getInvitation(id: string) {
    const invitation = await this.repo.findInvitationById(id);
    if (!invitation) throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
    const participantCount = await this.repo.countParticipants(id);
    return {
      id: invitation.id,
      title: invitation.title,
      status: invitation.status,
      eventStartAt: invitation.eventStartAt,
      isPublic: invitation.isPublic,
      createdAt: invitation.createdAt,
      stats: { participantCount },
    };
  }

  async setInvitationStatus(id: string, status: 'active' | 'closed') {
    const row = await this.repo.setInvitationStatus(id, status);
    if (!row) throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
    return row;
  }

  async deleteInvitation(id: string) {
    const invitation = await this.repo.findInvitationById(id);
    if (!invitation) throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
    await this.repo.softDeleteInvitation(id);
  }
}
