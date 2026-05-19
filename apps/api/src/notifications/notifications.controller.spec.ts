import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { UserRole } from '../common/enums/role.enum';

const mockService = {
  findAll: jest.fn(),
  getUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
};

const user: JwtPayload = { id: 'u1', role: UserRole.MEMBER, scope: [] };

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compile();

    controller = module.get(NotificationsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('cursor, limit을 service.findAll에 전달', async () => {
      const expected = { items: [], hasNext: false, nextCursor: null };
      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(user, { cursor: 'c1', limit: 10 });

      expect(mockService.findAll).toHaveBeenCalledWith('u1', 'c1', 10);
      expect(result).toBe(expected);
    });

    it('cursor 없으면 undefined 전달', async () => {
      mockService.findAll.mockResolvedValue({ items: [], hasNext: false, nextCursor: null });

      await controller.findAll(user, { limit: 20 });

      expect(mockService.findAll).toHaveBeenCalledWith('u1', undefined, 20);
    });
  });

  describe('getUnreadCount', () => {
    it('service.getUnreadCount(userId) 호출', async () => {
      mockService.getUnreadCount.mockResolvedValue({ count: 5 });

      const result = await controller.getUnreadCount(user);

      expect(mockService.getUnreadCount).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('getSettings', () => {
    it('service.getSettings(userId) 호출', async () => {
      const settings = { isRemind: true };
      mockService.getSettings.mockResolvedValue(settings);

      expect(await controller.getSettings(user)).toBe(settings);
      expect(mockService.getSettings).toHaveBeenCalledWith('u1');
    });
  });

  describe('markAllAsRead', () => {
    it('service.markAllAsRead(userId) 호출', async () => {
      mockService.markAllAsRead.mockResolvedValue(undefined);

      await controller.markAllAsRead(user);

      expect(mockService.markAllAsRead).toHaveBeenCalledWith('u1');
    });
  });

  describe('updateSettings', () => {
    it('service.updateSettings(userId, dto) 호출', async () => {
      const dto = { isRemind: false };
      const updated = { isRemind: false };
      mockService.updateSettings.mockResolvedValue(updated);

      expect(await controller.updateSettings(user, dto)).toBe(updated);
      expect(mockService.updateSettings).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('markAsRead', () => {
    it('service.markAsRead(userId, id) 호출', async () => {
      const noti = { id: 'n1', isRead: true };
      mockService.markAsRead.mockResolvedValue(noti);

      expect(await controller.markAsRead('n1', user)).toBe(noti);
      expect(mockService.markAsRead).toHaveBeenCalledWith('u1', 'n1');
    });
  });
});
