import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { FaqService } from './faq.service';

@Controller('faq')
export class FaqController {
  constructor(private readonly service: FaqService) {}

  @Public()
  @Get()
  getActive() {
    return this.service.getActive();
  }
}
