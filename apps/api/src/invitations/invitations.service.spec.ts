import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { TemplatesRepository } from '../templates/templates.repository';
import { S3_CLIENT } from '../s3/s3.module';
import { ErrorCode } from '../common/constants/error-codes';
import type { Invitation } from '../database/schema';

const mockInvitationsRepo = () => ({
  findById: jest.fn(),
  findAllByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  countGuests: jest.fn(),
});

const mockTemplatesRepo = () => ({
  findById: jest.fn(),
});

function makeInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: 'INV001',
    userId: 'U001',
    title: '우리 결혼식',
    description: '',
    mainImageKey: 'invitations/main.jpg',
    status: 'active',
    templateId: null,
    isMissionEnabled: false,
    eventStartAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Invitation;
}

describe('InvitationsService', () => {
  let service: InvitationsService;
  let repo: ReturnType<typeof mockInvitationsRepo>;
  let templatesRepo: ReturnType<typeof mockTemplatesRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: InvitationsRepository, useFactory: mockInvitationsRepo },
        { provide: TemplatesRepository, useFactory: mockTemplatesRepo },
        { provide: S3_CLIENT, useValue: { send: jest.fn() } },
        { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('test-bucket') } },
      ],
    }).compile();

    service = module.get(InvitationsService);
    repo = module.get(InvitationsRepository) as unknown as ReturnType<typeof mockInvitationsRepo>;
    templatesRepo = module.get(TemplatesRepository) as unknown as ReturnType<typeof mockTemplatesRepo>;
  });

  describe('findOne', () => {
    it('존재하지 않는 초대장 — INVITATION_NOT_FOUND(404)', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne('INV999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('INV999')).rejects.toMatchObject({
        response: expect.objectContaining({ code: ErrorCode.INVITATION_NOT_FOUND }),
      });
    });

    it('soft-deleted 초대장 — INVITATION_NOT_FOUND(404)', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne('DELETED_INV')).rejects.toThrow(NotFoundException);
    });

    it('정상 초대장 조회 — 반환', async () => {
      const inv = makeInvitation();
      repo.findById.mockResolvedValue(inv);

      const result = await service.findOne('INV001');

      expect(result).toEqual(inv);
    });
  });

  describe('create', () => {
    it('유효한 templateId — 초대장 생성', async () => {
      templatesRepo.findById.mockResolvedValue({ id: 'T001', isActive: true });
      repo.create.mockResolvedValue(makeInvitation({ templateId: 'T001' }));

      const result = await service.create('U001', { title: '생일파티', templateId: 'T001' } as any);

      expect(repo.create).toHaveBeenCalled();
      expect(result.templateId).toBe('T001');
    });

    it('존재하지 않는 templateId — TEMPLATE_NOT_FOUND(404)', async () => {
      templatesRepo.findById.mockResolvedValue(null);

      await expect(service.create('U001', { title: '파티', templateId: 'T999' } as any)).rejects.toThrow(NotFoundException);
      await expect(service.create('U001', { title: '파티', templateId: 'T999' } as any)).rejects.toMatchObject({
        response: expect.objectContaining({ code: ErrorCode.TEMPLATE_NOT_FOUND }),
      });
    });

    it('templateId 없음 — 바로 생성', async () => {
      repo.create.mockResolvedValue(makeInvitation());

      await service.create('U001', { title: '파티' } as any);

      expect(templatesRepo.findById).not.toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('참가자가 있는 초대장 삭제 시 INVITATION_HAS_PARTICIPANTS(403)', async () => {
      repo.findById.mockResolvedValue(makeInvitation());
      repo.countGuests.mockResolvedValue(3);

      await expect(service.remove('INV001')).rejects.toThrow(ForbiddenException);
      await expect(service.remove('INV001')).rejects.toMatchObject({
        response: expect.objectContaining({ code: ErrorCode.INVITATION_HAS_PARTICIPANTS }),
      });
    });

    it('참가자 없는 초대장 삭제 성공', async () => {
      repo.findById.mockResolvedValue(makeInvitation());
      repo.countGuests.mockResolvedValue(0);
      repo.remove.mockResolvedValue(undefined);

      await expect(service.remove('INV001')).resolves.not.toThrow();
      expect(repo.remove).toHaveBeenCalledWith('INV001');
    });

    it('존재하지 않는 초대장 삭제 시 INVITATION_NOT_FOUND(404)', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.remove('INV999')).rejects.toThrow(NotFoundException);
    });
  });
});
