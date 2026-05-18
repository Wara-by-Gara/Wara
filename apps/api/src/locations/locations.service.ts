import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { KakaoLocalService } from './kakao-local.service';
import { ErrorCode } from '../common/constants/error-codes';
import type { SetEventLocationDto } from './dto/set-event-location.dto';
import type { UpdateParticipantLocationDto } from './dto/update-participant-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    private readonly repository: LocationsRepository,
    private readonly kakaoLocal: KakaoLocalService,
  ) {}

  async getEventLocation(invitationId: string) {
    const location = await this.repository.findEventLocation(invitationId);
    if (!location) {
      throw new NotFoundException(ErrorCode.LOCATION_NOT_FOUND);
    }
    return location;
  }

  async setEventLocation(invitationId: string, dto: SetEventLocationDto) {
    return this.repository.upsertEventLocation(invitationId, dto);
  }

  async deleteEventLocation(invitationId: string) {
    await this.repository.deleteEventLocation(invitationId);
  }

  async getParticipantLocations(invitationId: string) {
    return this.repository.findAllParticipantLocations(invitationId);
  }

  async searchPlaces(query: string, page: number, size: number) {
    return this.kakaoLocal.searchByKeyword(query, page, size);
  }

  async updateMyLocation(
    invitationId: string,
    userId: string,
    dto: UpdateParticipantLocationDto,
  ) {
    const participant = await this.repository.findParticipant(
      userId,
      invitationId,
    );
    if (!participant) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    return this.repository.upsertParticipantLocation(
      invitationId,
      participant.id,
      dto,
    );
  }
}
