import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { HostGuard } from './host.guard';
import { MemberRole } from '../enums/member-role.enum';
import { UserRole } from '../enums/role.enum';
import {
  IParticipantRepository,
  PARTICIPANT_REPOSITORY,
} from '../repositories/participant.repository.interface';
import { createMockExecutionContext, createMockRequest } from './test-utils';

describe('HostGuard', () => {
  let guard: HostGuard;
  let reflector: jest.Mocked<Reflector>;
  let repo: jest.Mocked<IParticipantRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        HostGuard,
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
        {
          provide: PARTICIPANT_REPOSITORY,
          useValue: { findMemberRole: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get(HostGuard);
    reflector = module.get(Reflector);
    repo = module.get(PARTICIPANT_REPOSITORY);
  });

  const userReq = (memberRole?: MemberRole | null) => {
    if (memberRole !== undefined) {
      repo.findMemberRole.mockResolvedValue(memberRole);
    }
    return createMockRequest({
      user: { id: 'u1', role: UserRole.MEMBER, scope: [] },
      params: { invitationId: 'inv1' },
    });
  };

  it('메타데이터가 없으면 통과한다', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = createMockExecutionContext(userReq());

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(repo.findMemberRole).not.toHaveBeenCalled();
  });

  it('user가 없으면 TOKEN_INVALID로 401을 던진다', async () => {
    reflector.getAllAndOverride.mockReturnValue([MemberRole.HOST]);
    const ctx = createMockExecutionContext(
      createMockRequest({ params: { invitationId: 'inv1' } }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('invitationId 파라미터가 없으면 400을 던진다', async () => {
    reflector.getAllAndOverride.mockReturnValue([MemberRole.HOST]);
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: { id: 'u1', role: UserRole.MEMBER, scope: [] },
      }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
  });

  describe('HOST_ONLY ([HOST])', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue([MemberRole.HOST]);
    });

    it('HOST는 통과', async () => {
      const ctx = createMockExecutionContext(userReq(MemberRole.HOST));
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('CO_HOST는 거부', async () => {
      const ctx = createMockExecutionContext(userReq(MemberRole.CO_HOST));
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('GUEST는 거부', async () => {
      const ctx = createMockExecutionContext(userReq(MemberRole.GUEST));
      await expect(guard.canActivate(ctx)).rejects.toThrow('INSUFFICIENT_ROLE');
    });

    it('participant 미존재 시 거부', async () => {
      const ctx = createMockExecutionContext(userReq(null));
      await expect(guard.canActivate(ctx)).rejects.toThrow('INSUFFICIENT_ROLE');
    });
  });

  describe('HOST_OR_COHOST ([HOST, CO_HOST])', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue([
        MemberRole.HOST,
        MemberRole.CO_HOST,
      ]);
    });

    it('HOST는 통과', async () => {
      const ctx = createMockExecutionContext(userReq(MemberRole.HOST));
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('CO_HOST는 통과', async () => {
      const ctx = createMockExecutionContext(userReq(MemberRole.CO_HOST));
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('GUEST는 거부', async () => {
      const ctx = createMockExecutionContext(userReq(MemberRole.GUEST));
      await expect(guard.canActivate(ctx)).rejects.toThrow('INSUFFICIENT_ROLE');
    });
  });
});
