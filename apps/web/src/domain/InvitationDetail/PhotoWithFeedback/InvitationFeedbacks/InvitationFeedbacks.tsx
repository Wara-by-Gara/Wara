'use client';


import { CommentInputBar } from '@/components/organisms';
import { CommentItem } from '@/components/organisms/CommentItem/CommentItem';
import { useInvitationFeedback } from '@/hooks/useInvitationFeedbacks';

interface Props {
  invitationId: string;
  token: string;
}

export default function InvitationFeedbacks({ invitationId, token }: Props) {
  const { data, submitComment, fetchNextPage, hasNextPage } = useInvitationFeedback(invitationId, token);
  const allRows = data?.pages.flatMap((p) => p.rows) ?? [];
  const comments = allRows

  return (
    <div className="mt-4">
      <div className="flex flex-col">
        {comments.map((f) => (
          <CommentItem
            key={f.id}
            authorName={f.participant.id}
            content={f.content}
            createdAt={new Date(f.createdAt).toLocaleDateString('ko-KR')}
            replies={f.replies.map((r) => ({
              id: r.id,
              authorName: r.participant.id,
              content: r.content,
              createdAt: new Date(r.createdAt).toLocaleDateString('ko-KR'),
            }))}
          />
        ))}
        {hasNextPage && (
          <button onClick={() => fetchNextPage()} className="text-sm text-gray-400 py-2 text-center">
            더 보기
          </button>
        )}
      </div>
      <CommentInputBar onSubmit={submitComment} />
    </div>
  );
}