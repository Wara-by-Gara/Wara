'use client';

import { useState } from 'react';
import Link from 'next/link';

const SEED_EMAILS = [
  'host1@wara.dev',
  'host2@wara.dev',
  'host3@wara.dev',
  'host4@wara.dev',
  'guest01@wara.dev',
  'guest02@wara.dev',
  'admin@wara.dev',
];

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export default function DevPage() {
  const [email, setEmail] = useState(SEED_EMAILS[0]);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleGetToken() {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/dev/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.code ?? '토큰 발급 실패');
      const accessToken = (json?.data?.accessToken ?? json?.accessToken) as string;
      setToken(accessToken);
      document.cookie = `accessToken=${accessToken}; path=/; max-age=1800; SameSite=Lax`;
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    document.cookie = 'accessToken=; path=/; max-age=0';
    setToken('');
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Dev Token 발급</h1>
        <p className="text-sm text-gray-500 mt-1">개발 환경 전용 — 시드 유저 이메일로 JWT 토큰 발급</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">시드 유저 선택</label>
          <select
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {SEED_EMAILS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGetToken}
          disabled={isLoading}
          className="w-full py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isLoading ? '발급 중...' : '토큰 발급 & localStorage 저장'}
        </button>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {token && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-600">✓ 토큰 저장됨</p>
              <button onClick={handleClear} className="text-xs text-gray-400 hover:text-gray-600">
                토큰 삭제
              </button>
            </div>
            <textarea
              readOnly
              value={token}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-xs font-mono bg-gray-50 resize-none"
            />
            <div className="flex gap-2">
              <Link
                href="/inquiries"
                className="flex-1 py-2 text-center text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                문의 페이지로 이동
              </Link>
              <button
                onClick={() => navigator.clipboard.writeText(token)}
                className="flex-1 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                토큰 복사
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
