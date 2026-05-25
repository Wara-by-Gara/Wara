import { useMutation } from '@tanstack/react-query';
import { logout } from '@/lib/api/auth';

export function useLogout() {
  return useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem('refresh_token') ?? '';
      return logout(refreshToken);
    },
    onSettled: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
  });
}
