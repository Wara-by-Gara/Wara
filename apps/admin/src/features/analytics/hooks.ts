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

export function useOverview(from: string, to: string) {
  return useQuery({
    queryKey: keys.overview(from, to),
    queryFn: () => analyticsApi.overview(from, to),
  });
}

export function useInvitationStats(from: string, to: string) {
  return useQuery({
    queryKey: keys.invitations(from, to),
    queryFn: () => analyticsApi.invitations(from, to),
  });
}

export function useChannels(from: string, to: string) {
  return useQuery({
    queryKey: keys.channels(from, to),
    queryFn: () => analyticsApi.channels(from, to),
  });
}

export function useConversion(from: string, to: string) {
  return useQuery({
    queryKey: keys.conversion(from, to),
    queryFn: () => analyticsApi.conversion(from, to),
  });
}

export function useRetention(weeks: number) {
  return useQuery({
    queryKey: keys.retention(weeks),
    queryFn: () => analyticsApi.retention(weeks),
  });
}
