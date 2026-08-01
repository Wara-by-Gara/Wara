'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiPost } from '@/lib/api/client';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/users', label: '사용자 관리' },
  { href: '/inquiries', label: '문의 관리' },
  { href: '/reports', label: '신고 처리' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthorized } = useAdminAuth();

  async function handleLogout() {
    try {
      await apiPost('/auth/logout');
    } catch {
      // ignore errors, redirect anyway
    }
    router.push('/login');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-sm text-gray-400">로딩 중...</span>
      </div>
    );
  }
  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-44 shrink-0 bg-[#1c2537] flex flex-col print:hidden">
        <div className="px-5 py-4">
          <span className="text-base font-bold text-white tracking-wide">Wara Admin</span>
        </div>
        <nav className="flex-1 py-2 px-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                pathname === href
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto print:w-full">
        {children}
      </main>
    </div>
  );
}
