/**
 * ZUKAI LIBRARY QUERY HOOKS
 * Location: /zukai/src/features/library/hooks/useLibrary.ts
 */

import { useQuery } from '@tanstack/react-query';
import { fetchLibraryItems, LibraryItem } from '../api/libraryApi';

export const libraryKeys = {
  all: ['library'] as const,
  list: (orgId?: string | null) => [...libraryKeys.all, { orgId: orgId ?? null }] as const,
};

export function useLibrary(orgId?: string | null) {
  return useQuery<LibraryItem[]>({
    queryKey: libraryKeys.list(orgId),
    queryFn: () => fetchLibraryItems(orgId),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

