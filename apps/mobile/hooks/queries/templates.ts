import { useQuery } from '@tanstack/react-query';

import { getTemplates, templateKeys } from '@/api';

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list,
    queryFn: ({ signal }) => getTemplates({ signal }),
    staleTime: 5 * 60 * 1000, // 템플릿은 자주 안 바뀜
  });
}
