export const DICEBEAR_PROFILE_PREFIX = 'dicebear:';

export function isDicebearProfileImage(value: string): boolean {
  return value.startsWith(DICEBEAR_PROFILE_PREFIX);
}
