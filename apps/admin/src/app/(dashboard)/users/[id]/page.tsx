'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, CheckCircle2, Users, User } from 'lucide-react';
import { useUser, useSuspendUser, useUnsuspendUser, useUpdateUserRole } from '@/features/users/hooks';
import type { SocialProvider } from '@/features/users/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const PROVIDER_LABEL: Record<SocialProvider, string> = {
  kakao: '카카오',
  naver: '네이버',
  google: 'Google',
  apple: 'Apple',
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

function formatDate(date: string | null | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start py-3 border-b last:border-0">
      <span className="w-32 text-sm text-muted-foreground shrink-0 pt-px">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="py-8 px-6 max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-20 rounded bg-muted" />
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-5 w-36 rounded bg-muted" />
              <div className="h-3.5 w-48 rounded bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3.5 w-full rounded bg-muted" />
          ))}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6 h-24" /></Card>
        ))}
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useUser(id);
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const roleMutation = useUpdateUserRole();

  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  if (isLoading) return <SkeletonDetail />;

  if (!user) {
    return (
      <div className="py-8 px-6">
        <span className="text-sm text-muted-foreground">사용자를 찾을 수 없습니다.</span>
      </div>
    );
  }

  const isSuspended = !!user.suspendedAt;
  const isWithdrawn = !!user.deletedAt;
  async function handleSuspend() {
    await suspendMutation.mutateAsync({ id, reason: suspendReason || undefined });
    setShowSuspendForm(false);
    setSuspendReason('');
  }

  async function handleUnsuspend() {
    await unsuspendMutation.mutateAsync({ id });
  }

  async function handleRoleToggle() {
    const newRole = user!.role === 'admin' ? 'member' : 'admin';
    await roleMutation.mutateAsync({ id, role: newRole });
  }

  const avatarInitial = (user.nickname ?? user.name ?? '?').charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(user.nickname ?? user.name ?? '?');

  const StatusBadgeInline = () => {
    if (isWithdrawn) return <Badge variant="secondary">탈퇴</Badge>;
    if (isSuspended) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">정지</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">활성</Badge>;
  };

  return (
    <div className="py-8 px-6 max-w-2xl mx-auto pb-16 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/users')}
        className="text-muted-foreground -ml-2"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        목록으로
      </Button>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
              <AvatarFallback className={`text-xl font-semibold ${avatarColor}`}>
                {avatarInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold">{user.nickname ?? '-'}</span>
                {user.name && <span className="text-sm text-muted-foreground">({user.name})</span>}
                <StatusBadgeInline />
              </div>
              <span className="text-sm text-muted-foreground">{user.email ?? '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 계정 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">계정 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="가입일" value={formatDate(user.createdAt)} />
          <InfoRow label="마지막 접속" value={formatDate(user.lastLoginAt)} />
          {user.deletedAt && <InfoRow label="탈퇴일" value={formatDate(user.deletedAt)} />}
          {user.suspendedAt && (
            <InfoRow
              label="정지일"
              value={<span className="text-red-600 font-medium">{formatDate(user.suspendedAt)}</span>}
            />
          )}
          {user.suspendedReason && (
            <InfoRow label="정지 사유" value={<span className="text-red-500">{user.suspendedReason}</span>} />
          )}
        </CardContent>
      </Card>

      {/* 소셜 연동 */}
      {user.socialAccounts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">소셜 연동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {user.socialAccounts.map((sa) => (
                <Badge key={sa.provider} className={`px-3 py-1.5 text-sm ${PROVIDER_STYLE[sa.provider]}`}>
                  {PROVIDER_LABEL[sa.provider]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 활동 통계 */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">활동 통계</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '호스팅 전체', value: user.stats.hostedTotal, icon: <Calendar className="w-4 h-4 text-blue-500" />, iconBg: 'bg-blue-50' },
            { label: '호스팅 활성', value: user.stats.hostedActive, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, iconBg: 'bg-emerald-50' },
            { label: '전체 참가', value: user.stats.participations, icon: <Users className="w-4 h-4 text-violet-500" />, iconBg: 'bg-violet-50' },
            { label: '게스트 참가', value: user.stats.guestCount, icon: <User className="w-4 h-4 text-orange-500" />, iconBg: 'bg-orange-50' },
          ].map(({ label, value, icon, iconBg }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>
                  {icon}
                </div>
                <div className="text-3xl font-bold leading-none mb-1">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 권한 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">권한</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">현재 역할</span>
              {user.role === 'admin' ? (
                <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">admin</Badge>
              ) : (
                <Badge variant="secondary">member</Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRoleToggle}
              disabled={roleMutation.isPending}
            >
              {roleMutation.isPending
                ? '처리 중...'
                : user.role === 'admin'
                ? 'member로 강등'
                : 'admin으로 승격'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 계정 상태 */}
      <Card className={!isWithdrawn && !isSuspended ? 'border-destructive/30 bg-destructive/5' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">계정 상태</CardTitle>
        </CardHeader>
        <CardContent>
          {isWithdrawn ? (
            <span className="text-sm text-muted-foreground">탈퇴한 계정입니다.</span>
          ) : isSuspended ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">정지된 계정</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(user.suspendedAt)}부터 정지</p>
              </div>
              <Button
                onClick={handleUnsuspend}
                disabled={unsuspendMutation.isPending}
              >
                {unsuspendMutation.isPending ? '처리 중...' : '정지 해제'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-destructive">정지 시 해당 사용자는 서비스 이용이 즉시 제한됩니다.</p>
              {!showSuspendForm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowSuspendForm(true)}
                >
                  계정 정지
                </Button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="정지 사유 (선택)"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleSuspend}
                      disabled={suspendMutation.isPending}
                    >
                      {suspendMutation.isPending ? '처리 중...' : '정지 확인'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setShowSuspendForm(false); setSuspendReason(''); }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
