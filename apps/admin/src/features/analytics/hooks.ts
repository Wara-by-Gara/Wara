import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from './api';

const keys = {
  all: ['analytics'] as const,
  overview: (from: string, to: string) => ['analytics', 'overview', from, to] as const,
  invitations: (from: string, to: string) => ['analytics', 'invitations', from, to] as const,
  channels: (from: string, to: string) => ['analytics', 'channels', from, to] as const,
  conversion: (from: string, to: string) => ['analytics', 'conversion', from, to] as const,
  retention: (weeks: number) => ['analytics', 'retention', weeks] as const,
};

const STALE_5MIN = 5 * 60 * 1000;

export function useOverview(from: string, to: string) {
  return useQuery({
    queryKey: keys.overview(from, to),
    queryFn: () => analyticsApi.overview(from, to),
    staleTime: STALE_5MIN,
  });
}

export function useInvitationStats(from: string, to: string) {
  return useQuery({
    queryKey: keys.invitations(from, to),
    queryFn: () => analyticsApi.invitations(from, to),
    staleTime: STALE_5MIN,
  });
}

export function useChannels(from: string, to: string) {
  return useQuery({
    queryKey: keys.channels(from, to),
    queryFn: () => analyticsApi.channels(from, to),
    staleTime: STALE_5MIN,
  });
}

export function useConversion(from: string, to: string) {
  return useQuery({
    queryKey: keys.conversion(from, to),
    queryFn: () => analyticsApi.conversion(from, to),
    staleTime: STALE_5MIN,
  });
}

export function useRetention(weeks: number) {
  return useQuery({
    queryKey: keys.retention(weeks),
    queryFn: () => analyticsApi.retention(weeks),
    staleTime: STALE_5MIN,
  });
}
