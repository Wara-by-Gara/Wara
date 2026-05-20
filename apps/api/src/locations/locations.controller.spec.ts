import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { HostGuard } from '../common/guards/host.guard';
import { ParticipantGuard } from '../common/guards/participant.guard';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { UserRole } from '../common/enums/role.enum';

const mockService = {
  getEventLocation: jest.fn(),
  setEventLocation: jest.fn(),
  deleteEventLocation: jest.fn(),
  getParticipantLocations: jest.fn(),
  updateMyLocation: jest.fn(),
};

const user: JwtPayload = { id: 'u1', role: UserRole.MEMBER, scope: [] };

describe('LocationsController', () => {
  let controller: LocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [{ provide: LocationsService, useValue: mockService }],
    })
      .overrideGuard(HostGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ParticipantGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(LocationsController);
    jest.clearAllMocks();
  });

  describe('getEventLocation', () => {
    it('service.getEventLocation(invitationId) 호출', async () => {
      const location = { id: 'loc1' };
      mockService.getEventLocation.mockResolvedValue(location);

      expect(await controller.getEventLocation('inv1')).toBe(location);
      expect(mockService.getEventLocation).toHaveBeenCalledWith('inv1');
    });
  });

  describe('setEventLocation', () => {
    it('service.setEventLocation(invitationId, dto) 호출', async () => {
      const dto = { address: 'addr', placeName: 'place', detailAddress: '', lat: 37, lng: 127, placeId: 'pid' };
      const saved = { id: 'loc1', ...dto };
      mockService.setEventLocation.mockResolvedValue(saved);

      expect(await controller.setEventLocation('inv1', dto)).toBe(saved);
      expect(mockService.setEventLocation).toHaveBeenCalledWith('inv1', dto);
    });
  });

  describe('deleteEventLocation', () => {
    it('service.deleteEventLocation(invitationId) 호출', async () => {
      mockService.deleteEventLocation.mockResolvedValue(undefined);

      await controller.deleteEventLocation('inv1');

      expect(mockService.deleteEventLocation).toHaveBeenCalledWith('inv1');
    });
  });

  describe('getParticipantLocations', () => {
    it('service.getParticipantLocations(invitationId) 호출', async () => {
      const locations = [{ id: 'l1' }];
      mockService.getParticipantLocations.mockResolvedValue(locations);

      expect(await controller.getParticipantLocations('inv1')).toBe(locations);
      expect(mockService.getParticipantLocations).toHaveBeenCalledWith('inv1');
    });
  });

  describe('updateMyLocation', () => {
    it('service.updateMyLocation(invitationId, userId, dto) 호출', async () => {
      const dto = { lat: 37.5, lng: 127.0, accuracy: 10 };
      const saved = { id: 'l1', ...dto };
      mockService.updateMyLocation.mockResolvedValue(saved);

      expect(await controller.updateMyLocation('inv1', user, dto)).toBe(saved);
      expect(mockService.updateMyLocation).toHaveBeenCalledWith('inv1', 'u1', dto);
    });
  });
});
