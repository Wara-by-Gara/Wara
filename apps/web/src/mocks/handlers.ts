import { http, HttpResponse } from 'msw';
import type { Notification, NotificationSettings } from '@/lib/api/notifications';

const BASE = 'http://localhost:3001/api';

export const mockNotification: Notification = {
  id: 'n1',
  userId: 'u1',
  actorUserId: 'a1',
  type: 'feedback',
  content: '새 피드백이 도착했어요',
  targetType: 'feedback',
  targetId: 't1',
  isRead: false,
  readAt: null,
  createdAt: '2026-05-20T10:00:00.000Z',
};

export const mockSettings: NotificationSettings = {
  id: 's1',
  userId: 'u1',
  isRemind: true,
  isFeedback: true,
  isInvitationDate: true,
  isPhoto: true,
  isMission: true,
  isParticipantLocations: true,
  isEventLocations: true,
  createdAt: '2026-05-20T10:00:00.000Z',
  updatedAt: '2026-05-20T10:00:00.000Z',
};

function wrap<T>(data: T) {
  return {
    success: true,
    data,
    meta: { requestId: 'test-id', timestamp: '2026-05-20T10:00:00.000Z' },
  };
}

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    userId: 'u1',
    actorUserId: 'a2',
    type: 'feedback',
    content: '김민수님이 피드백을 남겼어요',
    targetType: 'feedback',
    targetId: 'f1',
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'n2',
    userId: 'u1',
    actorUserId: 'a3',
    type: 'photo',
    content: '이지은님이 사진을 업로드했어요',
    targetType: 'photo',
    targetId: 'p1',
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n3',
    userId: 'u1',
    actorUserId: null,
    type: 'remind',
    content: '내일 행사가 있어요. 잊지 마세요!',
    targetType: 'invitation',
    targetId: 'i1',
    isRead: false,
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'n4',
    userId: 'u1',
    actorUserId: 'a4',
    type: 'invitation_date',
    content: '행사 날짜가 변경되었어요',
    targetType: 'invitation',
    targetId: 'i1',
    isRead: true,
    readAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export const handlers = [
  http.get(`${BASE}/notifications`, () =>
    HttpResponse.json(wrap({ items: mockNotifications, nextCursor: null, hasNext: false })),
  ),

  http.get(`${BASE}/notifications/unread`, () =>
    HttpResponse.json(wrap({ count: mockNotifications.filter((n) => !n.isRead).length })),
  ),

  http.get(`${BASE}/notifications/settings`, () =>
    HttpResponse.json(wrap(mockSettings)),
  ),

  http.patch(`${BASE}/notifications/readAll`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.patch(`${BASE}/notifications/:id/read`, ({ params }) =>
    HttpResponse.json(
      wrap({ ...mockNotification, id: params.id as string, isRead: true, readAt: '2026-05-20T11:00:00.000Z' }),
    ),
  ),

  http.patch(`${BASE}/notifications/settings`, async ({ request }) => {
    const body = await request.json() as Partial<NotificationSettings>;
    return HttpResponse.json(wrap({ ...mockSettings, ...body }));
  }),
];
