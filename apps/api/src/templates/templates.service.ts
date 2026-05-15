import { Injectable, NotFoundException } from '@nestjs/common';
import { TemplatesRepository } from './templates.repository';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class TemplatesService {
  constructor(private readonly repository: TemplatesRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new NotFoundException({ code: ErrorCode.TEMPLATE_NOT_FOUND, message: '템플릿을 찾을 수 없습니다.' });
    }
    return template;
  }

  create(dto: CreateTemplateDto) {
    return this.repository.create(dto);
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id);
    return this.repository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repository.remove(id);
  }
}
