import { Injectable } from '@nestjs/common';
import { ActivityFeedRepository } from './activity-feed.repository';
import { ACTIVITY_TYPES, type ActivityType, type ListActivityDto } from './dto/list-activity.dto';

interface Actor {
  userId: string;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

export interface ActivityItem {
  id: string;               // `${type}:${sourceId}` — 소스 간 유일
  type: ActivityType;
  actor: Actor | null;      // vote_confirmed는 actor 없음
  occurredAt: string;       // ISO 8601
  data: Record<string, unknown>;
}

const COMMENT_EXCERPT_LEN = 80;

@Injectable()
export class ActivityFeedService {
  constructor(private readonly repo: ActivityFeedRepository) {}

  async list(invitationId: string, dto: ListActivityDto) {
    const before = dto.cursor ? new Date(dto.cursor) : undefined;
    const wanted = new Set<ActivityType>(dto.types ?? ACTIVITY_TYPES);
    // 커서 페이지네이션: 각 소스에서 limit개씩 가져와 병합 후 상위 limit개만 취한다.
    const perSource = { invitationId, before, limit: dto.limit };

    const [joins, photos, comments, votes] = await Promise.all([
      wanted.has('participant_joined') ? this.repo.findJoins(perSource) : Promise.resolve([]),
      wanted.has('photo_uploaded')     ? this.repo.findPhotoUploads(perSource) : Promise.resolve([]),
      wanted.has('comment_added')      ? this.repo.findComments(perSource) : Promise.resolve([]),
      wanted.has('vote_confirmed')     ? this.repo.findVoteConfirmations(perSource) : Promise.resolve([]),
    ]);

    const items: ActivityItem[] = [
      ...joins.map((r) => ({
        id: `participant_joined:${r.id}`,
        type: 'participant_joined' as const,
        actor: this.toActor(r),
        occurredAt: r.occurredAt.toISOString(),
        data: { participantId: r.id, memberRole: r.memberRole },
      })),
      ...photos.map((r) => ({
        id: `photo_uploaded:${r.id}`,
        type: 'photo_uploaded' as const,
        actor: this.toActor(r),
        occurredAt: r.occurredAt.toISOString(),
        data: { photoId: r.id, thumbnailKey: r.thumbnailKey },
      })),
      ...comments.map((r) => ({
        id: `comment_added:${r.id}`,
        type: 'comment_added' as const,
        actor: this.toActor(r),
        occurredAt: r.occurredAt.toISOString(),
        data: {
          feedbackId: r.id,
          photoId: r.photoId,
          excerpt: r.content ? r.content.slice(0, COMMENT_EXCERPT_LEN) : null,
        },
      })),
      ...votes.map((r) => ({
        id: `vote_confirmed:${r.id}`,
        type: 'vote_confirmed' as const,
        actor: null,
        occurredAt: r.occurredAt.toISOString(),
        data: { pollId: r.id, title: r.title, voteType: r.voteType },
      })),
    ];

    // 시간 내림차순 정렬 후 상위 limit개.
    items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
    const page = items.slice(0, dto.limit);
    // 더 가져올 게 있으면(각 소스가 limit을 꽉 채웠거나 병합 결과가 limit 초과) 다음 커서 제공.
    const nextCursor =
      items.length > dto.limit && page.length > 0 ? page[page.length - 1]!.occurredAt : null;

    return { items: page, nextCursor };
  }

  private toActor(r: {
    actorUserId: string | null;
    name: string | null;
    nickname: string | null;
    profileImageUrl: string | null;
  }): Actor | null {
    if (!r.actorUserId) return null;
    return {
      userId: r.actorUserId,
      name: r.name,
      nickname: r.nickname,
      profileImageUrl: r.profileImageUrl,
    };
  }
}
