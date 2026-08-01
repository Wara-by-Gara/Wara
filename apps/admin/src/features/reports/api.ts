import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import type { AdminReport, ReportStatus } from './types';

export function fetchReports(params: { status?: ReportStatus; limit?: number }) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  qs.set('limit', String(params.limit ?? 50));
  return apiGet<AdminReport[]>(`/admin/reports?${qs}`);
}

export function updateReport(id: string, body: { status?: ReportStatus; adminMemo?: string }) {
  return apiPatch<AdminReport>(`/admin/reports/${id}`, body);
}

export function hideReport(id: string) {
  return apiPost<AdminReport>(`/admin/reports/${id}/hide`);
}

export function restoreReport(id: string) {
  return apiPost<AdminReport>(`/admin/reports/${id}/restore`);
}
