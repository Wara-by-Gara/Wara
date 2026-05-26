'use client';

import { useState } from 'react';
import { CommentItem } from '@/components/organisms/CommentItem/CommentItem';
import { useInvitationFeedback } from '@/hooks/useInvitationFeedbacks';
import { CommentInputBar } from '@/components/organisms';
import { timeAgo } from '@/utils/timeAge';

interface Props {
  invitationId: string;
  currentUserId: string | null;
}

export default function InvitationFeedbacks({ invitationId, currentUserId }: Props) {
  const { data, submitComment, fetchNextPage, hasNextPage, removeComment, editComment } =
    useInvitationFeedback(invitationId);
  const allRows = data?.pages.flatMap((p) => p.rows) ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  return (
    <div className="mt-4">
      <div className="flex flex-col">
        {allRows.map((f) => (
          <div key={f.id}>
            <CommentItem
              authorName={f.participant.user?.nickname ?? f.participant.userId}
              authorAvatarUrl={f.participant.user?.profileImageUrl ?? undefined}
              content={f.deletedAt ? '' : f.content}
              createdAt={timeAgo(f.createdAt)}
              imageUrl={
                f.photo?.imageKey
                  ? `https://demmy.s3.ap-northeast-2.amazonaws.com/${f.photo.imageKey}`
                  : undefined
              }
              variant={
                f.deletedAt ? 'deleted' :
                f.participant.userId === currentUserId ? 'mine' : 'default'
              }
              moreMenuItems={
                f.participant.userId === currentUserId && !f.deletedAt
                  ? [
                      {
                        label: '수정',
                        onClick: () => {
                          setEditingId(f.id);
                          setEditContent(f.content);
                        },
                        className: 'text-blue-500',
                      },
                      {
                        label: '삭제',
                        onClick: () => removeComment(f.id),
                        className: 'text-red-500',
                      },
                    ]
                  : undefined
              }
              editingSlot={
                editingId === f.id ? (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <button
                      className="text-xs text-blue-500"
                      onClick={async () => {
                        await editComment(f.id, editContent);
                        setEditingId(null);
                      }}
                    >
                      저장
                    </button>
                    <button
                      className="text-xs text-gray-400"
                      onClick={() => setEditingId(null)}
                    >
                      취소
                    </button>
                  </div>
                ) : undefined
              }
              replies={f.replies.map((r) => ({
                id: r.id,
                authorName: r.participant.user?.nickname ?? r.participant.userId,
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