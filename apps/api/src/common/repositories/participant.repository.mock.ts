import { Injectable } from '@nestjs/common';
import { MemberRole } from '../enums/member-role.enum';
import { IParticipantRepository } from './participant.repository.interface';

@Injectable()
export class MockParticipantRepository implements IParticipantRepository {
  private readonly store = new Map<string, MemberRole>();

  private key(userId: string, invitationId: string): string {
    return `${userId}:${invitationId}`;
  }

  set(userId: string, invitationId: string, role: MemberRole): void {
    this.store.set(this.key(userId, invitationId), role);
  }

  clear(): void {
    this.store.clear();
  }

  async findMemberRole(
    userId: string,
    invitationId: string,
  ): Promise<MemberRole | null> {
    return this.store.get(this.key(userId, invitationId)) ?? null;
  }
}
