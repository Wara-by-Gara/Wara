import { Body, Controller, Put } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { LocationsService } from './locations.service';
import { setDefaultTierSchema, type SetDefaultTierDto } from './dto/set-location-tier.dto';

// 유저 계정 단위 위치 설정 (초대장 무관).
@Controller('me/location')
export class MyLocationController {
  constructor(private readonly locationsService: LocationsService) {}

  /** 위치 공유 기본 프라이버시 티어 설정. */
  @Put('tier')
  setDefaultTier(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(setDefaultTierSchema)) dto: SetDefaultTierDto,
  ) {
    return this.locationsService.setMyDefaultTier(user.id, dto.tier);
  }
}
