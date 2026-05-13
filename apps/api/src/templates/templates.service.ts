import { Injectable } from '@nestjs/common';
import { TemplatesRepository } from './templates.repository';

@Injectable()
export class TemplatesService {
  constructor(private readonly repository: TemplatesRepository) {}
}
