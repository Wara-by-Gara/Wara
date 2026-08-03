import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReports, updateReport, hideReport, restoreReport } from './api';
import type { ReportStatus } from './types';

const reportsKeys = {
  all: ['reports'] as const,
  list: (status?: ReportStatus) => [...reportsKeys.all, 'list', status] as const,
};

export function useReports(status?: ReportStatus) {
  return useQuery({
    queryKey: reportsKeys.list(status),
    queryFn: () => fetchReports({ status }),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: ReportStatus; adminMemo?: string }) =>
      updateReport(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportsKeys.all }),
  });
}

export function useHideReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hideReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportsKeys.all }),
  });
}

export function useRestoreReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportsKeys.all }),
  });
}
