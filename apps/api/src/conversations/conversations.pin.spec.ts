import { NotFoundException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ErrorCode } from '../common/constants/error-codes';

// 공지 고정(pin/unpin)의 메시지 소속·삭제 검증. assertMember/repo는 mock.
describe('ConversationsService — pin/unpin', () => {
  let repo: {
    findMessageById: jest.Mock;
    setPinnedMessage: jest.Mock;
  };
  let service: ConversationsService;

  beforeEach(() => {
    repo = {
      findMessageById: jest.fn(),
      setPinnedMessage: jest.fn().mockResolvedValue(undefined),
    };
    service = new ConversationsService(
      repo as never, {} as never, {} as never, {} as never, {} as never,
    );
    // assertMember는 멤버십 통과로 스텁 (pin 로직만 검증)
    jest.spyOn(service as unknown as { assertMember: jest.Mock }, 'assertMember')
      .mockResolvedValue({ userId: 'u1' } as never);
  });

  it('메시지가 해당 대화방 소속이 아니면 MESSAGE_NOT_FOUND', async () => {
    repo.findMessageById.mockResolvedValue({ id: 'm1', conversationId: 'OTHER', deletedAt: null });
    await expect(service.pinMessage('u1', 'c1', 'm1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.setPinnedMessage).not.toHaveBeenCalled();
  });

  it('삭제된 메시지는 고정 불가', async () => {
    repo.findMessageById.mockResolvedValue({ id: 'm1', conversationId: 'c1', deletedAt: new Date() });
    await expect(service.pinMessage('u1', 'c1', 'm1')).rejects.toMatchObject({
      message: ErrorCode.MESSAGE_NOT_FOUND,
    });
  });

  it('정상 메시지는 고정', async () => {
    repo.findMessageById.mockResolvedValue({ id: 'm1', conversationId: 'c1', deletedAt: null });
    const res = await service.pinMessage('u1', 'c1', 'm1');
    expect(repo.setPinnedMessage).toHaveBeenCalledWith('c1', 'm1');
    expect(res).toEqual({ pinnedMessageId: 'm1' });
  });

  it('unpin은 null로 설정', async () => {
    await service.unpinMessage('u1', 'c1');
    expect(repo.setPinnedMessage).toHaveBeenCalledWith('c1', null);
  });
});
