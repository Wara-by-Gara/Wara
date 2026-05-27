import { Injectable, NotFoundException } from '@nestjs/common';
import { FaqRepository } from './faq.repository';
import { ErrorCode } from '../common/constants/error-codes';
import type { CreateFaqDto } from './dto/create-faq.dto';
import type { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqService {
  constructor(private readonly repo: FaqRepository) {}

  getActive() {
    return this.repo.findActive();
  }

  getAll() {
    return this.repo.findAll();
  }

  async create(dto: CreateFaqDto, adminId: string) {
    return this.repo.create({ ...dto, createdBy: adminId });
  }

  async update(id: string, dto: UpdateFaqDto) {
    const item = await this.repo.update(id, dto);
    if (!item) throw new NotFoundException(ErrorCode.FAQ_NOT_FOUND);
    return item;
  }

  async remove(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(ErrorCode.FAQ_NOT_FOUND);
    await this.repo.softDelete(id);
  }
}
