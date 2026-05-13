import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateInvitationStatusDto } from '../dto/update-invitation-status.dto';
import {
  AdminInvitationView,
  InvitationAdminRepository,
} from '../repositories/invitation-admin.repository';

@Injectable()
export class AdminInvitationsService {
  constructor(
    private readonly invitationRepository: InvitationAdminRepository,
  ) {}

  async updateStatus(
    invitationId: string,
    dto: UpdateInvitationStatusDto,
  ): Promise<AdminInvitationView> {
    const existing = await this.invitationRepository.findById(invitationId);
    if (!existing) throw new NotFoundException('INVITATION_NOT_FOUND');
    return this.invitationRepository.close(invitationId, dto.reason ?? null);
  }
}
