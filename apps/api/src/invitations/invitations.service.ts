import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InvitationsRepository } from './invitations.repository';
import { TemplatesRepository } from '../templates/templates.repository';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly repository: InvitationsRepository,
    private readonly templatesRepository: TemplatesRepository,
  ) {}

  async findAll(userId: string) {
    return this.repository.findAllByUserId(userId);
  }

  async findOne(id: string) {
    const invitation = await this.repository.findById(id);
    if (!invitation) {
      throw new NotFoundException({ code: ErrorCode.INVITATION_NOT_FOUND, message: '초대장을 찾을 수 없습니다.' });
    }
    return invitation;
  }

  private async validateTemplateId(templateId: string) {
    const template = await this.templatesRepository.findById(templateId);
    if (!template) {
      throw new NotFoundException({ code: ErrorCode.TEMPLATE_NOT_FOUND, message: '템플릿을 찾을 수 없습니다.' });
    }
  }

  async create(userId: string, dto: CreateInvitationDto) {
    if (dto.templateId) {
      await this.validateTemplateId(dto.templateId);
    }
    return this.repository.create(userId, dto);
  }

  async update(id: string, dto: UpdateInvitationDto) {
    const current = await this.findOne(id);
    if (dto.templateId && dto.templateId !== current.templateId) {
      await this.validateTemplateId(dto.templateId);
    }
    return this.repository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    const guestCount = await this.repository.countGuests(id);
    if (guestCount > 0) {
      throw new ForbiddenException({ code: ErrorCode.INVITATION_HAS_PARTICIPANTS, message: '참석자가 있는 초대장은 삭제할 수 없습니다.' });
    }
    return this.repository.remove(id);
  }
}
