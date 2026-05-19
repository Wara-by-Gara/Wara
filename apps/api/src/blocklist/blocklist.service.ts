import { Injectable } from '@nestjs/common';
import { BlocklistsRepository } from './blocklists.repository';

@Injectable()
export class BlocklistService {
  constructor(private readonly repository: BlocklistsRepository) {}

  async list(invitationId: string) {
    const data = await this.repository.findByInvitation(invitationId);
    return { data };
  }

  async unblock(invitationId: string, userId: string): Promise<void> {
    await this.repository.remove(invitationId, userId);
  }
}
