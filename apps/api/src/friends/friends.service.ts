import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { S3Service } from '../s3/s3.service';
import { FriendsRepository } from './friends.repository';

export interface FriendListItem {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  sharedCount: number;
  lastSharedTitle: string;
  lastSharedAt: Date | null;
}

export interface FriendProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  sharedCount: number;
  mutualFriends: { id: string; name: string | null; avatarUrl: string | null }[];
  sharedInvitations: {
    id: string;
    title: string;
    eventStartAt: Date | null;
    status: 'active' | 'closed';
    isHostedByMe: boolean;
    imageUrl: string | null;
    location: string | null;
  }[];
}

@Injectable()
export class FriendsService {
  constructor(
    private readonly repository: FriendsRepository,
    private readonly s3Service: S3Service,
  ) {}

  private resolveImageUrl(key: string | null): Promise<string | null> {
    if (!key) return Promise.resolve(null);
    return this.s3Service.getViewPresignedUrl(key);
  }

  private async resolveInvitationCoverUrl(inv: {
    mainCoverType: string;
    mainImageKey: string | null;
    mainGifUrl: string | null;
  }): Promise<string | null> {
    if (inv.mainCoverType === 'gif' && inv.mainGifUrl) {
      return inv.mainGifUrl;
    }
    return this.resolveImageUrl(inv.mainImageKey);
  }

  // eventStartAt이 더 최근(또는 null이 아닌) 쪽을 최신으로 본다.
  private isMoreRecent(candidate: Date | null, current: Date | null): boolean {
    if (candidate === null) return false;
    if (current === null) return true;
    return candidate.getTime() > current.getTime();
  }

  async getFriends(myUserId: string): Promise<{ friends: FriendListItem[] }> {
    const hiddenIds = await this.repository.findHiddenIds(myUserId);
    const rows = await this.repository.findCoParticipationRows(myUserId, hiddenIds);

    const grouped = new Map<
      string,
      {
        name: string | null;
        profileImageUrl: string | null;
        invitationIds: Set<string>;
        lastTitle: string;
        lastAt: Date | null;
      }
    >();

    for (const row of rows) {
      const existing = grouped.get(row.friendUserId);
      if (!existing) {
        grouped.set(row.friendUserId, {
          name: row.name,
          profileImageUrl: row.profileImageUrl,
          invitationIds: new Set([row.invitationId]),
          lastTitle: row.title,
          lastAt: row.eventStartAt,
        });
        continue;
      }
      existing.invitationIds.add(row.invitationId);
      if (this.isMoreRecent(row.eventStartAt, existing.lastAt)) {
        existing.lastAt = row.eventStartAt;
        existing.lastTitle = row.title;
      }
    }

    const friends = await Promise.all(
      [...grouped.entries()].map(async ([id, value]) => ({
        id,
        name: value.name,
        avatarUrl: await this.resolveImageUrl(value.profileImageUrl),
        sharedCount: value.invitationIds.size,
        lastSharedTitle: value.lastTitle,
        lastSharedAt: value.lastAt,
      })),
    );

    friends.sort((a, b) => {
      if (b.sharedCount !== a.sharedCount) return b.sharedCount - a.sharedCount;
      const bTime = b.lastSharedAt?.getTime() ?? 0;
      const aTime = a.lastSharedAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    return { friends };
  }

  // 친구 삭제 = 영구 숨김 (목록에서 제외)
  async hideFriend(myUserId: string, targetUserId: string): Promise<void> {
    await this.repository.addHide(myUserId, targetUserId);
  }

  // 삭제한 친구 복원
  async restoreFriend(myUserId: string, targetUserId: string): Promise<void> {
    await this.repository.removeHide(myUserId, targetUserId);
  }

  // 삭제(숨김)한 친구 목록 — 복원 화면용
  async getHiddenFriends(myUserId: string) {
    const rows = await this.repository.findHiddenFriends(myUserId);
    return {
      friends: await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          name: r.name,
          avatarUrl: await this.resolveImageUrl(r.profileImageUrl),
          hiddenAt: r.hiddenAt,
        })),
      ),
    };
  }

  async getFriendProfile(
    myUserId: string,
    targetUserId: string,
  ): Promise<FriendProfile> {
    const sharedInvitationRows =
      await this.repository.findSharedInvitations(myUserId, targetUserId);

    // 함께 참여한 초대가 없으면 내 친구가 아니므로 조회 불가.
    if (sharedInvitationRows.length === 0) {
      throw new NotFoundException(ErrorCode.FRIEND_NOT_FOUND);
    }

    const target = await this.repository.findUserBasic(targetUserId);
    if (!target) {
      throw new NotFoundException(ErrorCode.FRIEND_NOT_FOUND);
    }

    const mutualRows = await this.repository.findMutual(myUserId, targetUserId);
    const dedupedMutual = new Map<
      string,
      { name: string | null; profileImageUrl: string | null }
    >();
    for (const row of mutualRows) {
      if (!dedupedMutual.has(row.userId)) {
        dedupedMutual.set(row.userId, {
          name: row.name,
          profileImageUrl: row.profileImageUrl,
        });
      }
    }

    const [avatarUrl, mutualFriends, sharedInvitations] = await Promise.all([
      this.resolveImageUrl(target.profileImageUrl),
      Promise.all(
        [...dedupedMutual.entries()].map(async ([id, value]) => ({
          id,
          name: value.name,
          avatarUrl: await this.resolveImageUrl(value.profileImageUrl),
        })),
      ),
      Promise.all(
        sharedInvitationRows.map(async (inv) => ({
          id: inv.id,
          title: inv.title,
          eventStartAt: inv.eventStartAt,
          status: inv.status,
          isHostedByMe: inv.hostUserId === myUserId,
          imageUrl: await this.resolveInvitationCoverUrl(inv),
          location: inv.placeName ?? null,
        })),
      ),
    ]);

    return {
      id: target.id,
      name: target.name,
      avatarUrl,
      sharedCount: sharedInvitationRows.length,
      mutualFriends,
      sharedInvitations,
    };
  }
}
