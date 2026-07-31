'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useUsers } from '@/features/users/hooks';
import type { AdminUserListItem, SocialProvider } from '@/features/users/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PROVIDER_LABEL: Record<SocialProvider, string> = {
  kakao: 'K',
  naver: 'N',
  google: 'G',
  apple: 'A',
};

const PROVIDER_STYLE: Record<SocialProvider, string> = {
  kakao: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  naver: 'bg-green-100 text-green-700 hover:bg-green-100',
  google: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  apple: 'bg-gray-900 text-white hover:bg-gray-900',
};

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',
];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const STATUS_TABS = [
  { label: '전체', value: undefined },
  { label: '활성', value: 'active' },
  { label: '정지', value: 'suspended' },
  { label: '탈퇴', value: 'withdrawn' },
] as const;

const LIMIT = 20;

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ko-KR');
}

function StatusBadge({ user }: { user: AdminUserListItem }) {
  if (user.deletedAt) return <Badge variant="secondary">탈퇴</Badge>;
  if (user.suspendedAt)
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">정지</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">활성</Badge>;
}

function RoleBadge({ role }: { role: 'admin' | 'member' }) {
  if (role === 'admin')
    return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">admin</Badge>;
  return <Badge variant="secondary">member</Badge>;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
            </div>
          </TableCell>
          <TableCell><div className="h-3.5 w-40 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-5 w-10 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-5 w-14 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-3.5 w-20 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-5 w-10 rounded bg-muted animate-pulse" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useUsers({ query: query || undefined, status, limit: LIMIT, offset });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const currentPage = Math.floor(offset / LIMIT);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(inputValue);
    setOffset(0);
  }

  function handleStatusChange(val: string | undefined) {
    setStatus(val);
    setOffset(0);
  }

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">사용자 관리</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              총 <span className="font-semibold text-foreground">{data?.total ?? '—'}</span>명의 사용자
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="이름, 이메일, 닉네임"
                  className="pl-8 w-56"
                />
              </div>
              <Button type="submit">검색</Button>
            </form>

            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              {STATUS_TABS.map((tab) => (
                <button
                  key={String(tab.value)}
                  onClick={() => handleStatusChange(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    status === tab.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table card */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">닉네임 / 이름</TableHead>
                <TableHead className="font-semibold">이메일</TableHead>
                <TableHead className="font-semibold">소셜</TableHead>
                <TableHead className="font-semibold">역할</TableHead>
                <TableHead className="font-semibold">가입일</TableHead>
                <TableHead className="font-semibold">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : !data?.users.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Search className="w-8 h-8 opacity-30" />
                      <span className="text-sm">사용자가 없습니다.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.users.map((user) => {
                  const initial = (user.nickname ?? user.name ?? '?').charAt(0).toUpperCase();
                  const avatarColor = getAvatarColor(user.nickname ?? user.name ?? '?');
                  return (
                    <TableRow
                      key={user.id}
                      onClick={() => router.push(`/users/${user.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={`text-xs font-semibold ${avatarColor}`}>
                              {initial}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-medium">{user.nickname ?? '-'}</span>
                            {user.name && (
                              <span className="text-xs text-muted-foreground">({user.name})</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.providers.map((p) => (
                            <Badge
                              key={p}
                              className={`w-5 h-5 p-0 flex items-center justify-center text-xs font-bold rounded ${PROVIDER_STYLE[p]}`}
                            >
                              {PROVIDER_LABEL[p]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell><StatusBadge user={user} /></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-between bg-muted/20">
            <span className="text-xs text-muted-foreground">
              총 <span className="font-medium text-foreground">{data?.total ?? 0}</span>명
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setOffset((currentPage - 1) * LIMIT)}
              >
                이전
              </Button>
              <span className="px-3 text-xs text-muted-foreground min-w-[4rem] text-center">
                {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '—'}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setOffset((currentPage + 1) * LIMIT)}
              >
                다음
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
