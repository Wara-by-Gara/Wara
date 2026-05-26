import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LocationsController } from './locations.controller';
import { LocationsSearchController } from './locations-search.controller';
import { LocationsService } from './locations.service';
import { LocationsRepository } from './locations.repository';
import { LocationsGateway } from './locations.gateway';
import { KakaoLocalService } from './kakao-local.service';

@Module({
  imports: [AuthModule, HttpModule, NotificationsModule],
  controllers: [LocationsController, LocationsSearchController],
  providers: [
    LocationsService,
    LocationsRepository,
    LocationsGateway,
    KakaoLocalService,
  ],
})
export class LocationsModule {}
