import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { DevAuthService } from './dev-auth.service';

const DevTokenSchema = z.object({
  email: z.string().email(),
});
type DevTokenDto = z.infer<typeof DevTokenSchema>;

@Controller('auth/dev')
export class DevAuthController {
  constructor(private readonly devAuthService: DevAuthService) {}

  @Public()
  @Post('token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  issueDevToken(
    @Body(new ZodValidationPipe(DevTokenSchema)) body: DevTokenDto,
  ) {
    return this.devAuthService.issueDevToken(body.email);
  }
}
