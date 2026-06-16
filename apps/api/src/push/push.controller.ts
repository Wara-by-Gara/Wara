import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PushService } from './push.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  SubscribePushSchema,
  type SubscribePushDto,
  UnsubscribePushSchema,
  type UnsubscribePushDto,
} from './dto/subscribe-push.dto';
import {
  RegisterDeviceSchema,
  type RegisterDeviceDto,
  UnregisterDeviceSchema,
  type UnregisterDeviceDto,
} from './dto/register-device.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }

  @Post('subscriptions')
  subscribe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(SubscribePushSchema)) dto: SubscribePushDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.pushService.subscribe(user.id, dto, userAgent);
  }

  @Delete('subscriptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  unsubscribe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UnsubscribePushSchema)) dto: UnsubscribePushDto,
  ) {
    return this.pushService.unsubscribe(user.id, dto.endpoint);
  }

  // ── 네이티브 푸시 기기 토큰 (Expo, mobile) ─────────────────────────────────

  @Post('device')
  registerDevice(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(RegisterDeviceSchema)) dto: RegisterDeviceDto,
  ) {
    return this.pushService.registerDevice(user.id, dto);
  }

  @Delete('device')
  @HttpCode(HttpStatus.NO_CONTENT)
  unregisterDevice(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UnregisterDeviceSchema)) dto: UnregisterDeviceDto,
  ) {
    return this.pushService.unregisterDevice(user.id, dto.token);
  }
}
