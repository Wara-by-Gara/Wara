export type SocialProvider = 'kakao' | 'naver' | 'google' | 'apple';

export type AdminUserListItem = {
  id: string;
  email: string | null;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
  role: 'admin' | 'member';
  suspendedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  providers: SocialProvider[];
};

export type AdminUserDetail = AdminUserListItem & {
  suspendedReason: string | null;
  lastLoginAt: string | null;
  promotedBy: string | null;
  promotedAt: string | null;
  promotedByNickname: string | null;
  socialAccounts: { provider: SocialProvider; createdAt: string }[];
  stats: {
    hostedActive: number;
    hostedTotal: number;
    guestCount: number;
    participations: number;
  };
};

export type UsersListResponse = {
  users: AdminUserListItem[];
  total: number;
  limit: number;
  offset: number;
};
