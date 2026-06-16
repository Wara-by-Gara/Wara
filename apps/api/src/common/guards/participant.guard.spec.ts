import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ParticipantGuard } from './participant.guard';
import { ParticipantRepository } from '../repositories/participant.repository';
import { ErrorCode } from '../constants/error-codes';
import type { Participant } from '../../database/schema';

const mockParticipant = { id: 'part-1', userId: 'user-1', invitationId: 'inv-1', rsvpStatus: 'attending' };

function makeContext(overrides: { userId?: string; invitationId?: string | undefined }): ExecutionContext {
  const req = {
    user: { id: overrides.userId ?? 'user-1' },
    params: overrides.invitationId !== undefined ? { invitationId: overrides.invitationId } : {},
    participant: undefined as unknown,
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('ParticipantGuard', () => {
  let guard: ParticipantGuard;
  let repository: jest.Mocked<ParticipantRepository>;

  beforeEach(() => {
    repository = { findByUserAndInvitation: jest.fn() } as unknown as jest.Mocked<ParticipantRepository>;
    guard = new ParticipantGuard(repository);
  });

  it('참가자 조회 성공 → true 반환 + request.participant 주입', async () => {
    repository.findByUserAndInvitation.mockResolvedValue(mockParticipant as unknown as Participant);
    const ctx = makeContext({ invitationId: 'inv-1' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(ctx.switchToHttp().getRequest().participant).toEqual(mockParticipant);
  });

  it('참가자 아님 → ForbiddenException(RSVP_PERMISSION_DENIED)', async () => {
    repository.findByUserAndInvitation.mockResolvedValue(null);
    const ctx = makeContext({ invitationId: 'inv-1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ErrorCode.RSVP_PERMISSION_DENIED);
  });

  it('invitationId 없음 → ForbiddenException(RSVP_PERMISSION_DENIED)', async () => {
    const ctx = makeContext({ invitationId: undefined });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('invitationId 빈 문자열 → ForbiddenException', async () => {
    const ctx = makeContext({ invitationId: '' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('repository 호출 시 userId + invitationId 정확히 전달', async () => {
    repository.findByUserAndInvitation.mockResolvedValue(mockParticipant as unknown as Participant);
    const ctx = makeContext({ userId: 'user-42', invitationId: 'inv-99' });

    await guard.canActivate(ctx);

    expect(repository.findByUserAndInvitation).toHaveBeenCalledWith('user-42', 'inv-99');
  });
});
