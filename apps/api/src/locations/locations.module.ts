import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocationsController } from './locations.controller';
import { LocationsSearchController } from './locations-search.controller';
import { MyLocationController } from './my-location.controller';
import { LocationsService } from './locations.service';
import { LocationsRepository } from './locations.repository';
import { LocationsRedisStore } from './locations.redis-store';
import { LocationsFlushScheduler } from './locations-flush.scheduler';
import { LocationsGateway } from './locations.gateway';
import { KakaoLocalService } from './kakao-local.service';
import { LocationPreEventScheduler } from './location-pre-event.scheduler';

@Module({
  imports: [AuthModule, HttpModule, NotificationsModule],
  controllers: [LocationsController, LocationsSearchController, MyLocationController],
  providers: [
    LocationsService,
    LocationsRepository,
    LocationsRedisStore,
    LocationsFlushScheduler,
    LocationsGateway,
    KakaoLocalService,
    LocationPreEventScheduler,
  ],
  exports: [LocationsService, KakaoLocalService],
})
export class LocationsModule {}
