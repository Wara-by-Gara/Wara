import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AdminInvitationView,
  IInvitationAdminRepository,
} from './invitation-admin.repository.interface';

@Injectable()
export class MockInvitationAdminRepository implements IInvitationAdminRepository {
  private readonly store = new Map<string, AdminInvitationView>();

  seed(invitation: AdminInvitationView): void {
    this.store.set(invitation.id, invitation);
  }

  clear(): void {
    this.store.clear();
  }

  async findById(id: string): Promise<AdminInvitationView | null> {
    return this.store.get(id) ?? null;
  }

  async close(id: string, reason: string | null): Promise<AdminInvitationView> {
    const invitation = this.store.get(id);
    if (!invitation) throw new NotFoundException('INVITATION_NOT_FOUND');
    const next: AdminInvitationView = {
      ...invitation,
      status: 'closed',
      closedAt: new Date(),
      closedReason: reason,
    };
    this.store.set(id, next);
    return next;
  }
}
