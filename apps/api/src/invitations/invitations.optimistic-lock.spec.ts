/**
 * InvitationsService.update — 낙관적 락 단위 테스트
 *
 * 검증 대상:
 * - expectedUpdatedAt 미전송 → 검사 스킵(옛 클라이언트 호환)
 * - expectedUpdatedAt 일치 → 정상 update
 * - expectedUpdatedAt 불일치 → ConflictException(INVITATION_VERSION_CONFLICT)
 * - expectedUpdatedAt이 dto의 일부지만 DB에는 저장되지 않음 (repository.update 호출 검증)
 *
 * 그 외 update 흐름(템플릿 검증·커버 verify·thumbnail enqueue)은 본 spec 범위 밖.
 */
import { ConflictException } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { ErrorCode } from '../common/constants/error-codes';
import type { UpdateInvitationDto } from './dto/update-invitation.dto';

type MockObj = Record<string, jest.Mock>;

const BASE_INVITATION = {
  id: 'inv1',
  userId: 'user1',
  templateId: null,
  status: 'active' as const,
  title: 'old',
  description: 'desc',
  mainCoverType: 'image' as const,
  mainImageKey: 'public/invitations/old.webp',
  mainImageThumbnailKey: null,
  mainGifUrl: null,
  eventStartAt: null,
  isMissionEnabled: false,
  bgColor: 'bg-white',
  font: 'default',
  rsvpAttendingEmoji: '🎉',
  rsvpAttendingLabel: '참석',
  rsvpMaybeEmoji: '🤔',
  rsvpMaybeLabel: '미정',
  rsvpDeclinedEmoji: '😭',
  rsvpDeclinedLabel: '불참',
  isPublic: false,
  category: null,
  fee: null,
  dressCode: null,
  parkingInfo: null,
  animation: null,
  updatedAt: new Date('2026-06-12T10:00:00.000Z'),
  createdAt: new Date('2026-06-01T10:00:00.000Z'),
  deletedAt: null,
};

function makeService(overrides: Partial<{ repository: MockObj }> = {}) {
  const repository: MockObj = overrides.repository ?? {
    findById: jest.fn().mockResolvedValue(BASE_INVITATION),
    update: jest
      .fn()
      .mockResolvedValue({ ...BASE_INVITATION, title: 'new' }),
  };

  // 다른 의존성은 호출되지 않는 시나리오만 다루므로 빈 객체로 충분.
  // constructor 인자 순서는 InvitationsService와 동일하게 유지.
  const noop = {} as never;
  const config = { getOrThrow: jest.fn().mockReturnValue('test-bucket') } as never;
  // toResponse가 s3Service.getPublicUrl을 호출하므로 stub 필요.
  const s3Service = {
    getPublicUrl: jest.fn((k: string) => `https://stub/${k}`),
  } as never;
  const service = new InvitationsService(
    repository as never, // repository
    noop, // aiJobsRepository
    noop, // templatesRepository
    s3Service, // s3Service
    noop, // s3
    config, // config — getOrThrow('AWS_S3_BUCKET') 사용
    noop, // aiService
    noop, // aiMonitoringService
    noop, // notificationsService
    noop, // imageProcessing
    noop, // imageJobs
    noop, // imageQueue
  );

  // toResponse는 private이지만 단순 매핑. test에선 호출 결과 형태만 사용.
  return { service, repository };
}

describe('InvitationsService.update — 낙관적 락', () => {
  it('expectedUpdatedAt 미전송 → 검사 스킵하고 정상 update', async () => {
    const { service, repository } = makeService();
    const dto: UpdateInvitationDto = { title: 'new' };

    await expect(service.update('inv1', dto)).resolves.toBeDefined();
    expect(repository.update).toHaveBeenCalledWith(
      'inv1',
      expect.objectContaining({ title: 'new' }),
    );
  });

  it('expectedUpdatedAt 일치 → 정상 update', async () => {
    const { service, repository } = makeService();
    const dto: UpdateInvitationDto = {
      title: 'new',
      expectedUpdatedAt: BASE_INVITATION.updatedAt,
    };

    await expect(service.update('inv1', dto)).resolves.toBeDefined();
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('expectedUpdatedAt 불일치 → 409 INVITATION_VERSION_CONFLICT', async () => {
    const { service, repository } = makeService();
    const dto: UpdateInvitationDto = {
      title: 'new',
      expectedUpdatedAt: new Date('2026-06-12T09:00:00.000Z'), // 1시간 전
    };

    await expect(service.update('inv1', dto)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.update('inv1', dto)).rejects.toMatchObject({
      message: ErrorCode.INVITATION_VERSION_CONFLICT,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('expectedUpdatedAt은 repository.update 호출 인자에서 제외돼야 함', async () => {
    const { service, repository } = makeService();
    const dto: UpdateInvitationDto = {
      title: 'new',
      expectedUpdatedAt: BASE_INVITATION.updatedAt,
    };

    await service.update('inv1', dto);
    const updateCall = repository.update!.mock.calls[0]![1] as Record<
      string,
      unknown
    >;
    expect(updateCall).not.toHaveProperty('expectedUpdatedAt');
    expect(updateCall.title).toBe('new');
  });

  it('대상 invitation 없음 → 404 (낙관적 락 검사 전에 NotFound)', async () => {
    const { service } = makeService({
      repository: {
        findById: jest.fn().mockResolvedValue(undefined),
        update: jest.fn(),
      },
    });
    const dto: UpdateInvitationDto = {
      title: 'new',
      expectedUpdatedAt: new Date(),
    };

    await expect(service.update('inv1', dto)).rejects.toMatchObject({
      message: ErrorCode.INVITATION_NOT_FOUND,
    });
  });
});
