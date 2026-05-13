import { Injectable } from '@nestjs/common';
import { IInvitationRepository } from './invitation.repository.interface';

@Injectable()
export class MockInvitationRepository implements IInvitationRepository {
  private readonly privateInvitations = new Set<string>();

  setPrivate(invitationId: string, isPrivate: boolean): void {
    if (isPrivate) {
      this.privateInvitations.add(invitationId);
    } else {
      this.privateInvitations.delete(invitationId);
    }
  }

  clear(): void {
    this.privateInvitations.clear();
  }

  async isPrivate(invitationId: string): Promise<boolean> {
    return this.privateInvitations.has(invitationId);
  }
}
