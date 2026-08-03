import { apiGet } from '@/lib/api/client';
import type {
  ChannelsResponse,
  ConversionResponse,
  InvitationStatsResponse,
  OverviewResponse,
  RetentionResponse,
} from './types';

function p(from: string, to: string) {
  return `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

export const analyticsApi = {
  overview: (from: string, to: string) =>
    apiGet<OverviewResponse>(`/admin/analytics/overview${p(from, to)}`),

  invitations: (from: string, to: string) =>
    apiGet<InvitationStatsResponse>(`/admin/analytics/invitations${p(from, to)}`),

  channels: (from: string, to: string) =>
    apiGet<ChannelsResponse>(`/admin/analytics/shares/channels${p(from, to)}`),

  conversion: (from: string, to: string) =>
    apiGet<ConversionResponse>(`/admin/analytics/shares/conversion${p(from, to)}`),

  retention: (weeks: number) =>
    apiGet<RetentionResponse>(`/admin/analytics/retention?weeks=${weeks}`),
};
