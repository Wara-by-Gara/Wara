import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { TermsRepository } from './terms.repository';
import type { AgreeTermsDto } from './dto/agree-terms.dto';
import type { CreateTermDto } from './dto/create-term.dto';
import type { UpdateTermDto } from './dto/update-term.dto';

@Injectable()
export class TermsService {
  constructor(private readonly repository: TermsRepository) {}

  findAllActive() {
    return this.repository.findAllActive();
  }

  async findById(id: string) {
    const term = await this.repository.findById(id);
    if (!term) throw new NotFoundException(ErrorCode.TERM_NOT_FOUND);
    return term;
  }

  async agreeTerms(userId: string, dto: AgreeTermsDto) {
    try {
      return await this.repository.createAgreements(userId, dto.termIds);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(ErrorCode.TERM_AGREEMENT_ALREADY_EXISTS);
      }
      throw error;
    }
  }

  findMyAgreements(userId: string) {
    return this.repository.findAgreementsByUser(userId);
  }

  findAll() {
    return this.repository.findAll();
  }

  create(dto: CreateTermDto, adminId: string) {
    return this.repository.create({ ...dto, createdBy: adminId });
  }

  async update(id: string, dto: UpdateTermDto) {
    const result = await this.repository.update(id, dto);
    if (!result) throw new NotFoundException(ErrorCode.TERM_NOT_FOUND);
    return result;
  }

  async activate(id: string) {
    const result = await this.repository.activate(id);
    if (!result) throw new NotFoundException(ErrorCode.TERM_NOT_FOUND);
    return result;
  }

  async softDelete(id: string) {
    const result = await this.repository.softDelete(id);
    if (!result) throw new NotFoundException(ErrorCode.TERM_NOT_FOUND);
  }
}
