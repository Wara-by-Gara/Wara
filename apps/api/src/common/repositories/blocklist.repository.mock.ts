import { Injectable } from '@nestjs/common';
import { IBlocklistRepository } from './blocklist.repository.interface';

@Injectable()
export class MockBlocklistRepository implements IBlocklistRepository {
  private readonly blocked = new Set<string>();

  private key(userId: string, invitationId: string): string {
    return `${userId}:${invitationId}`;
  }

  block(userId: string, invitationId: string): void {
    this.blocked.add(this.key(userId, invitationId));
  }

  clear(): void {
    this.blocked.clear();
  }

  async isBlocked(userId: string, invitationId: string): Promise<boolean> {
    return this.blocked.has(this.key(userId, invitationId));
  }
}
