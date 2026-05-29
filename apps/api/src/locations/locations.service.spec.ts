import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsRepository } from './locations.repository';
import { KakaoLocalService } from './kakao-local.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ErrorCode } from '../common/constants/error-codes';

const mockRepo = {
  findEventLocation: jest.fn(),
  upsertEventLocation: jest.fn(),
  deleteEventLocation: jest.fn(),
  findAllParticipantLocations: jest.fn(),
  findParticipantWithUser: jest.fn(),
  upsertParticipantLocation: jest.fn(),
};

const mockNotifications = { notify: jest.fn() };

const mockKakao = {
  searchByKeyword: jest.fn(),
};

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: LocationsRepository, useValue: mockRepo },
        { provide: KakaoLocalService, useValue: mockKakao },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get(LocationsService);
    jest.clearAllMocks();
  });

  describe('getEventLocation', () => {
    it('location 존재 → 반환', async () => {
      const location = { id: 'loc1', invitationId: 'inv1' };
      mockRepo.findEventLocation.mockResolvedValue(location);

      expect(await service.getEventLocation('inv1')).toBe(location);
    });

    it('location 없음 → NotFoundException(LOCATION_NOT_FOUND)', async () => {
      mockRepo.findEventLocation.mockResolvedValue(null);

      await expect(service.getEventLocation('inv1')).rejects.toThrow(
        new NotFoundException(ErrorCode.LOCATION_NOT_FOUND),
      );
    });
  });

  describe('setEventLocation', () => {
    it('repository.upsertEventLocation 호출 후 결과 반환', async () => {
      const dto = { address: 'addr', placeName: 'place', detailAddress: '', lat: 37, lng: 127, placeId: 'pid' };
      const saved = { id: 'loc1', ...dto };
      mockRepo.upsertEventLocation.mockResolvedValue(saved);

      expect(await service.setEventLocation('inv1', dto)).toBe(saved);
      expect(mockRepo.upsertEventLocation).toHaveBeenCalledWith('inv1', dto);
    });
  });

  describe('deleteEventLocation', () => {
    it('repository.deleteEventLocation 호출', async () => {
      mockRepo.deleteEventLocation.mockResolvedValue(undefined);

      await service.deleteEventLocation('inv1');

      expect(mockRepo.deleteEventLocation).toHaveBeenCalledWith('inv1');
    });
  });

  describe('getParticipantLocations', () => {
    it('repository.findAllParticipantLocations 위임', async () => {
      const locations = [{ id: 'l1' }];
      mockRepo.findAllParticipantLocations.mockResolvedValue(locations);

      expect(await service.getParticipantLocations('inv1')).toBe(locations);
      expect(mockRepo.findAllParticipantLocations).toHaveBeenCalledWith('inv1');
    });
  });

  describe('searchPlaces', () => {
    it('kakaoLocal.searchByKeyword 위임', async () => {
      const result = { places: [], meta: { totalCount: 0, pageableCount: 0, isEnd: true } };
      mockKakao.searchByKeyword.mockResolvedValue(result);

      expect(await service.searchPlaces('강남역', 1, 15)).toBe(result);
      expect(mockKakao.searchByKeyword).toHaveBeenCalledWith('강남역', 1, 15);
    });
  });

  describe('updateMyLocation', () => {
    const dto = { lat: 37.5, lng: 127.0, accuracy: 10 };

    it('participant 존재 → upsertParticipantLocation 호출', async () => {
      const participant = { id: 'p1' };
      const saved = { id: 'loc1' };
      mockRepo.findParticipantWithUser.mockResolvedValue(participant);
      mockRepo.upsertParticipantLocation.mockResolvedValue(saved);

      const result = await service.updateMyLocation('inv1', 'u1', dto);
      expect(result.location).toBe(saved);
      expect(mockRepo.upsertParticipantLocation).toHaveBeenCalledWith('inv1', 'p1', dto);
    });

    it('participant 없음 → ForbiddenException(PARTICIPANT_NOT_FOUND)', async () => {
      mockRepo.findParticipantWithUser.mockResolvedValue(null);

      await expect(service.updateMyLocation('inv1', 'u1', dto)).rejects.toThrow(
        new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND),
      );
    });
  });
});
