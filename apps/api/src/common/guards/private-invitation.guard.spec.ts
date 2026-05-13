import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrivateInvitationGuard } from './private-invitation.guard';
import {
  IInvitationRepository,
  INVITATION_REPOSITORY,
} from '../repositories/invitation.repository.interface';
import { createMockExecutionContext, createMockRequest } from './test-utils';

describe('PrivateInvitationGuard', () => {
  let guard: PrivateInvitationGuard;
  let repo: jest.Mocked<IInvitationRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PrivateInvitationGuard,
        {
          provide: INVITATION_REPOSITORY,
          useValue: { isPrivate: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get(PrivateInvitationGuard);
    repo = module.get(INVITATION_REPOSITORY);
    jwtService = module.get(JwtService);
  });

  it('invitationId 파라미터가 없으면 400을 던진다', async () => {
    const ctx = createMockExecutionContext(createMockRequest());
    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
  });

  it('private이 아닌 초대장이면 통과한다', async () => {
    repo.isPrivate.mockResolvedValue(false);
    const ctx = createMockExecutionContext(
      createMockRequest({ params: { invitationId: 'inv1' } }),
    );

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('private 초대장이고 유효 토큰이 있으면 통과한다', async () => {
    repo.isPrivate.mockResolvedValue(true);
    jwtService.verifyAsync.mockResolvedValue({ invitationId: 'inv1' });

    const ctx = createMockExecutionContext(
      createMockRequest({
        params: { invitationId: 'inv1' },
        headers: { 'x-access-token': 'valid.token' },
      }),
    );

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('private 초대장이고 토큰이 없으면 PASSWORD_REQUIRED로 401을 던진다', async () => {
    repo.isPrivate.mockResolvedValue(true);

    const ctx = createMockExecutionContext(
      createMockRequest({ params: { invitationId: 'inv1' } }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('PASSWORD_REQUIRED');
  });

  it('private 초대장이고 토큰이 유효하지 않으면 PASSWORD_REQUIRED로 401을 던진다', async () => {
    repo.isPrivate.mockResolvedValue(true);
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    const ctx = createMockExecutionContext(
      createMockRequest({
        params: { invitationId: 'inv1' },
        headers: { 'x-access-token': 'bad.token' },
      }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow('PASSWORD_REQUIRED');
  });
});
