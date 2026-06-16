// 탈퇴(soft-deleted) 회원의 표시용 정보를 마스킹한다.
// PII(name/nickname/profileImageUrl)를 서버에서 null로 지우고 isWithdrawn 플래그를 부여 →
// 클라이언트는 isWithdrawn이면 "탈퇴한 회원" + 회색 아바타로 렌더링한다.
export interface MaskableUser {
  name?: string | null;
  nickname?: string | null;
  profileImageUrl?: string | null;
  deletedAt?: Date | null;
}

export type MaskedUser<T extends MaskableUser> = Omit<T, 'deletedAt'> & {
  isWithdrawn: boolean;
};

export function maskUser<T extends MaskableUser>(user: T): MaskedUser<T> {
  const { deletedAt, ...rest } = user;
  const isWithdrawn = deletedAt != null;
  if (isWithdrawn) {
    return {
      ...rest,
      name: null,
      nickname: null,
      profileImageUrl: null,
      isWithdrawn,
    } as MaskedUser<T>;
  }
  return { ...rest, isWithdrawn } as MaskedUser<T>;
}
