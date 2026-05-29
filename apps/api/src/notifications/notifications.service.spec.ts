import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { ErrorCode } from '../common/constants/error-codes';

const mockRepo = {
  findAllByUser: jest.fn(),
  countUnreadByUser: jest.fn(),
  findById: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  findSettings: jest.fn(),
  upsertSettings: jest.fn(),
  create: jest.fn(),
};

const mockGateway = {
  sendToUser: jest.fn(),
  sendReadToUser: jest.fn(),
  sendReadAllToUser: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: mockRepo },
        { provide: NotificationsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get(NotificationsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('rows > limit: hasNext=true, items=slice(0, limit), nextCursor=마지막 id', async () => {
      mockRepo.findAllByUser.mockResolvedValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

      const result = await service.findAll('u1', undefined, 2);

      expect(result.hasNext).toBe(true);
      expect(result.items).toEqual([{ id: 'a' }, { id: 'b' }]);
      expect(result.nextCursor).toBe('b');
    });

    it('rows <= limit: hasNext=false, nextCursor=null', async () => {
      mockRepo.findAllByUser.mockResolvedValue([{ id: 'a' }]);

      const result = await service.findAll('u1', undefined, 2);

      expect(result.hasNext).toBe(false);
      expect(result.nextCursor).toBeNull();
      expect(result.items).toEqual([{ id: 'a' }]);
    });
  });

  describe('getUnreadCount', () => {
    it('countUnreadByUser 결과를 { count }로 반환', async () => {
      mockRepo.countUnreadByUser.mockResolvedValue(3);

      expect(await service.getUnreadCount('u1')).toEqual({ count: 3 });
      expect(mockRepo.countUnreadByUser).toHaveBeenCalledWith('u1');
    });
  });

  describe('markAsRead', () => {
    it('성공: markAsRead + sendReadToUser 호출', async () => {
      const noti = { id: 'n1', userId: 'u1' };
      mockRepo.findById.mockResolvedValue(noti);
      mockRepo.markAsRead.mockResolvedValue(noti);

      await service.markAsRead('u1', 'n1');

      expect(mockRepo.markAsRead).toHaveBeenCalledWith('n1');
      expect(mockGateway.sendReadToUser).toHaveBeenCalledWith('u1', 'n1');
    });

    it('notification 없음 → NotFoundException(NOTIFICATION_NOT_FOUND)', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.markAsRead('u1', 'n1')).rejects.toThrow(
        new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND),
      );
    });

    it('타인 알림 → ForbiddenException(NOTIFICATION_FORBIDDEN)', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'n1', userId: 'other' });

      await expect(service.markAsRead('u1', 'n1')).rejects.toThrow(
        new ForbiddenException(ErrorCode.NOTIFICATION_FORBIDDEN),
      );
    });
  });

  describe('markAllAsRead', () => {
    it('markAllAsRead + sendReadAllToUser 호출', async () => {
      mockRepo.markAllAsRead.mockResolvedValue(undefined);

      await service.markAllAsRead('u1');

      expect(mockRepo.markAllAsRead).toHaveBeenCalledWith('u1');
      expect(mockGateway.sendReadAllToUser).toHaveBeenCalledWith('u1');
    });
  });

  describe('getSettings', () => {
    it('repository.findSettings 위임', async () => {
      const settings = { isRemind: true };
      mockRepo.findSettings.mockResolvedValue(settings);

      expect(await service.getSettings('u1')).toBe(settings);
      expect(mockRepo.findSettings).toHaveBeenCalledWith('u1');
    });
  });

  describe('updateSettings', () => {
    it('repository.upsertSettings 위임', async () => {
      const dto = { isRemind: false };
      mockRepo.upsertSettings.mockResolvedValue(dto);

      expect(await service.updateSettings('u1', dto)).toBe(dto);
      expect(mockRepo.upsertSettings).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('notify', () => {
    it('TYPE_TO_SETTING에 없는 타입: settings 조회 없이 바로 create + sendToUser', async () => {
      const noti = { id: 'n1' };
      mockRepo.create.mockResolvedValue(noti);

      // 'unknown_type'은 TYPE_TO_SETTING에 없으므로 settingKey=undefined
      const result = await service.notify({
        userId: 'u1',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'unknown_type' as any,
        content: 'test',
      });

      expect(mockRepo.findSettings).not.toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockGateway.sendToUser).toHaveBeenCalledWith('u1', noti);
      expect(result).toBe(noti);
    });

    it('settings[key]=true → 알림 생성 + sendToUser', async () => {
      mockRepo.findSettings.mockResolvedValue({ isRemind: true });
      const noti = { id: 'n1' };
      mockRepo.create.mockResolvedValue(noti);

      const result = await service.notify({ userId: 'u1', type: 'remind', content: 'test' });

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockGateway.sendToUser).toHaveBeenCalledWith('u1', noti);
      expect(result).toBe(noti);
    });

    it('settings[key]=false → null 반환, create 미호출', async () => {
      mockRepo.findSettings.mockResolvedValue({ isRemind: false });

      const result = await service.notify({ userId: 'u1', type: 'remind', content: 'test' });

      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('settings=null(미설정) → 알림 생성', async () => {
      mockRepo.findSettings.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ id: 'n1' });

      await service.notify({ userId: 'u1', type: 'remind', content: 'test' });

      expect(mockRepo.create).toHaveBeenCalled();
    });
  });
});
