import { ActivityFeedService } from './activity-feed.service';
import type { ActivityFeedRepository } from './activity-feed.repository';

describe('ActivityFeedService.list', () => {
  let repo: jest.Mocked<Pick<
    ActivityFeedRepository,
    'findJoins' | 'findPhotoUploads' | 'findComments' | 'findVoteConfirmations'
  >>;
  let service: ActivityFeedService;

  const actor = { actorUserId: 'u1', name: '홍길동', nickname: null, profileImageUrl: null };

  beforeEach(() => {
    repo = {
      findJoins: jest.fn().mockResolvedValue([]),
      findPhotoUploads: jest.fn().mockResolvedValue([]),
      findComments: jest.fn().mockResolvedValue([]),
      findVoteConfirmations: jest.fn().mockResolvedValue([]),
    } as never;
    service = new ActivityFeedService(repo as never);
  });

  it('여러 소스를 시간 내림차순으로 병합한다', async () => {
    repo.findJoins.mockResolvedValue([{ ...actor, id: 'p1', occurredAt: new Date('2026-06-01T00:00:00Z'), memberRole: 'GUEST' }] as never);
    repo.findPhotoUploads.mockResolvedValue([{ ...actor, id: 'ph1', occurredAt: new Date('2026-06-03T00:00:00Z'), thumbnailKey: 'k' }] as never);
    repo.findComments.mockResolvedValue([{ ...actor, id: 'f1', occurredAt: new Date('2026-06-02T00:00:00Z'), content: 'hi', photoId: null }] as never);

    const res = await service.list('inv1', { limit: 20 } as never);
    expect(res.items.map((i) => i.type)).toEqual(['photo_uploaded', 'comment_added', 'participant_joined']);
    expect(res.nextCursor).toBeNull();
  });

  it('limit으로 자르고 nextCursor를 반환한다', async () => {
    repo.findJoins.mockResolvedValue([
      { ...actor, id: 'p1', occurredAt: new Date('2026-06-01T00:00:00Z'), memberRole: 'GUEST' },
      { ...actor, id: 'p2', occurredAt: new Date('2026-06-02T00:00:00Z'), memberRole: 'GUEST' },
      { ...actor, id: 'p3', occurredAt: new Date('2026-06-03T00:00:00Z'), memberRole: 'GUEST' },
    ] as never);

    const res = await service.list('inv1', { limit: 2 } as never);
    expect(res.items).toHaveLength(2);
    expect(res.items[0]!.data.participantId).toBe('p3');
    expect(res.nextCursor).toBe('2026-06-02T00:00:00.000Z');
  });

  it('types 필터가 있으면 해당 소스만 조회한다', async () => {
    await service.list('inv1', { limit: 20, types: ['photo_uploaded'] } as never);
    expect(repo.findPhotoUploads).toHaveBeenCalledTimes(1);
    expect(repo.findJoins).not.toHaveBeenCalled();
    expect(repo.findComments).not.toHaveBeenCalled();
    expect(repo.findVoteConfirmations).not.toHaveBeenCalled();
  });

  it('vote_confirmed는 actor가 null', async () => {
    repo.findVoteConfirmations.mockResolvedValue([{ id: 'poll1', occurredAt: new Date('2026-06-05T00:00:00Z'), title: '장소', voteType: 'custom' }] as never);
    const res = await service.list('inv1', { limit: 20 } as never);
    expect(res.items[0]!.actor).toBeNull();
    expect(res.items[0]!.data).toMatchObject({ pollId: 'poll1', title: '장소' });
  });
});
