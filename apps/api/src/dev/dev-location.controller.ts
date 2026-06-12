import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { LocationsService } from '../locations/locations.service';

/** E2E·로컬 검증용. DevAuthModule은 production에서 로드되지 않음. */
@Controller('dev/location')
export class DevLocationController {
  constructor(private readonly locationsService: LocationsService) {}

  @Public()
  @Post('process-pre-event')
  @HttpCode(HttpStatus.OK)
  async processPreEventNotifications() {
    const result = await this.locationsService.processPreEventNotifications();
    return { ok: true, ...result };
  }
}
