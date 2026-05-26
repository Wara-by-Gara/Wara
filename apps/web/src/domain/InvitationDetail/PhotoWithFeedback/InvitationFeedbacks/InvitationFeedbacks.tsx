'use client';

import { useState } from 'react';
import { CommentItem } from '@/components/organisms/CommentItem/CommentItem';
import { useInvitationFeedback } from '@/hooks/useInvitationFeedbacks';
import { CommentInputBar } from '@/components/organisms';
import { timeAgo } from '@/utils/timeAge';

interface Props {
  invitationId: string;
  token: string;
  currentUserId: string | null;
}

export default function InvitationFeedbacks({ invitationId, token, currentUserId }: Props) {
  const { data, submitComment, fetchNextPage, hasNextPage, removeComment, editComment } =
    useInvitationFeedback(invitationId, token);
  const allRows = data?.pages.flatMap((p) => p.rows) ?? [];
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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

            {/* 수정/삭제 메뉴 */}
            {menuOpenId === f.id && (
              <div className="flex gap-2 px-4 py-1">
                <button
                  className="text-xs text-blue-500"
                  onClick={() => {
                    setEditingId(f.id);
                    setEditContent(f.content);
                    setMenuOpenId(null);
                  }}
                >
                  수정
                </button>
                <button
                  className="text-xs text-red-500"
                  onClick={async () => {
                    await removeComment(f.id);
                    setMenuOpenId(null);
                  }}
                >
                  삭제
                </button>
                <button
                  className="text-xs text-gray-400"
                  onClick={() => setMenuOpenId(null)}
                >
                  취소
                </button>
              </div>
            )}

            <CommentItem
              authorName={f.participant.id}
              content={f.deletedAt ? '' : f.content}
              createdAt={timeAgo(f.createdAt)}
              variant={
                f.deletedAt ? 'deleted' :
                f.participant.userId === currentUserId ? 'mine' : 'default'
              }
              onMore={
                f.participant.userId === currentUserId && !f.deletedAt
                  ? () => setMenuOpenId(f.id)
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