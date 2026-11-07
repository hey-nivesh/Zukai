/**
 * ZUKAI USAGE & QUOTA QUERY HOOKS
 * Location: /zukai/src/features/usage/hooks/useUsageSummary.ts
 */

import { useQuery } from '@tanstack/react-query';
import { fetchUsageSummary, UsageSummary } from '../api/usageApi';

export const usageKeys = {
  all: ['usage'] as const,
  summary: (orgId?: string | null) => [...usageKeys.all, 'summary', { orgId: orgId ?? null }] as const,
};

export function useUsageSummary(orgId?: string | null) {
  return useQuery<UsageSummary>({
    queryKey: usageKeys.summary(orgId),
    queryFn: () => fetchUsageSummary(orgId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

