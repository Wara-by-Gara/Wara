import { describe, it, expect } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockSettings } from '@/mocks/handlers';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  fetchNotificationSettings,
  updateNotificationSettings,
} from './notifications';

const BASE = 'http://localhost:3000/api/v1';

function wrap<T>(data: T) {
  return { success: true, data, meta: { requestId: 'test', timestamp: '2026-05-20T10:00:00.000Z' } };
}

describe('fetchNotifications', () => {
  it('커서 없이 limit=20으로 요청한다', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/notifications`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(wrap({ items: [], nextCursor: null, hasNext: false }));
      }),
    );
    await fetchNotifications();
    expect(capturedUrl).toContain('limit=20');
    expect(capturedUrl).not.toContain('cursor=');
  });

  it('cursor를 전달하면 쿼리 파라미터에 포함된다', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/notifications`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(wrap({ items: [], nextCursor: null, hasNext: false }));
      }),
    );
    await fetchNotifications('cursor-abc');
    expect(capturedUrl).toContain('cursor=cursor-abc');
  });

  it('알림 목록과 페이지 메타를 반환한다', async () => {
    const result = await fetchNotifications();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result).toHaveProperty('nextCursor');
    expect(result).toHaveProperty('hasNext');
  });
});

describe('fetchUnreadCount', () => {
  it('미읽음 count를 반환한다', async () => {
    const result = await fetchUnreadCount();
    expect(typeof result.count).toBe('number');
    expect(result.count).toBe(3);
  });
});

describe('markAsRead', () => {
  it('PATCH /notifications/:id/read 를 호출하고 읽음 처리된 알림을 반환한다', async () => {
    const result = await markAsRead('n1');
    expect(result.id).toBe('n1');
    expect(result.isRead).toBe(true);
    expect(result.readAt).not.toBeNull();
  });
});

describe('markAllAsRead', () => {
  it('204 응답을 받아 undefined를 반환한다', async () => {
    const result = await markAllAsRead();
    expect(result).toBeUndefined();
  });
});

describe('fetchNotificationSettings', () => {
  it('알림 설정 객체를 반환한다', async () => {
    const result = await fetchNotificationSettings();
    expect(result?.id).toBe('s1');
    expect(result).toHaveProperty('isRemind');
    expect(result).toHaveProperty('isFeedback');
    expect(result).toHaveProperty('isParticipantLocations');
    expect(result).toHaveProperty('isEventLocations');
  });
});

describe('updateNotificationSettings', () => {
  it('변경 필드만 PATCH 바디에 담아 전송하고 업데이트된 설정을 반환한다', async () => {
    let capturedBody: unknown;
    server.use(
      http.patch(`${BASE}/notifications/settings`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(wrap({ ...mockSettings, isFeedback: false }));
      }),
    );
    const result = await updateNotificationSettings({ isFeedback: false });
    expect(capturedBody).toEqual({ isFeedback: false });
    expect(result.isFeedback).toBe(false);
  });

  it('변경하지 않은 필드는 기존 값을 유지한다', async () => {
    server.use(
      http.patch(`${BASE}/notifications/settings`, async () =>
        HttpResponse.json(wrap({ ...mockSettings, isPhoto: false })),
      ),
    );
    const result = await updateNotificationSettings({ isPhoto: false });
    expect(result.isPhoto).toBe(false);
    expect(result.isRemind).toBe(mockSettings.isRemind);
  });
});
