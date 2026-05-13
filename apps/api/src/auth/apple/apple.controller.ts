import { Controller, Post, Body } from '@nestjs/common';
import { AppleService } from './apple.service';
import { AppleCallbackDto, AppleCallbackSchema } from './apple-callback.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('auth')
export class AppleController {
  constructor(private readonly appleService: AppleService) {}

  // Apple은 카카오/네이버와 달리 redirect 없이 바로 POST로 callback이 옴
  // Content-Type: application/x-www-form-urlencoded
  @Post('apple/callback')
  async appleCallback(
    @Body(new ZodValidationPipe(AppleCallbackSchema)) dto: AppleCallbackDto,
  ) {
    return this.appleService.login(dto);
  }
}
