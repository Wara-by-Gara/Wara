'use client';

import { CommentItem } from '@/components/organisms/CommentItem/CommentItem';
import { useInvitationFeedback } from '@/hooks/useInvitationFeedbacks';
import { CommentInputBar } from '@/components/organisms';
import { timeAgo } from '@/utils/timeAge';

interface Props {
  invitationId: string;
  token: string;
  currentUserId: string | null;
}

export default function InvitationFeedbacks({
  invitationId,
  token,
  currentUserId,
}: Props) {
  const { data, submitComment, fetchNextPage, hasNextPage } =
    useInvitationFeedback(invitationId, token);
  const allRows = data?.pages.flatMap((p) => p.rows) ?? [];

  return (
    <div className="mt-4">
      <div className="flex flex-col">
        {allRows.map((f) => (
          <div key={f.id}>
            {f.photoId && f.photo && (
              <div className="px-4 pt-2">
                <img
                  src={`https://demmy.s3.ap-northeast-2.amazonaws.com/${f.photo.imageKey}`}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover"
                />
              </div>
            )}
            <CommentItem
              authorName={f.participant.id}
              content={f.content}
              createdAt={timeAgo(f.createdAt)}
              variant={
                f.participant.userId === currentUserId ? 'mine' : 'default'
              }
              onMore={
                f.participant.userId === currentUserId ? () => {} : undefined
              }
              replies={f.replies.map((r) => ({
                id: r.id,
                authorName: r.participant.id,
                content: r.content,
                createdAt: timeAgo(r.createdAt),
              }))}
            />
          </div>
        ))}
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            className="text-sm text-gray-400 py-2 text-center"
          >
            더 보기
          </button>
        )}
      </div>
      <CommentInputBar onSubmit={submitComment} />
    </div>
  );
}
