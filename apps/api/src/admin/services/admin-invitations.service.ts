import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateInvitationStatusDto } from '../dto/update-invitation-status.dto';
import {
  AdminInvitationView,
  IInvitationAdminRepository,
  INVITATION_ADMIN_REPOSITORY,
} from '../repositories/invitation-admin.repository.interface';

@Injectable()
export class AdminInvitationsService {
  constructor(
    @Inject(INVITATION_ADMIN_REPOSITORY)
    private readonly invitationRepository: IInvitationAdminRepository,
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
