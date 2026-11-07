/**
 * ZUKAI DOCUMENTS QUERY HOOKS
 * Location: /zukai/src/features/documents/hooks/useDocuments.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDocuments,
  fetchDocumentById,
  softDeleteDocument,
  DocumentRow,
} from '../api/documentsApi';

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (orgId?: string | null) => [...documentKeys.lists(), { orgId: orgId ?? null }] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

export function useDocuments(orgId?: string | null) {
  return useQuery({
    queryKey: documentKeys.list(orgId),
    queryFn: () => fetchDocuments(orgId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => fetchDocumentById(documentId),
    enabled: Boolean(documentId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSoftDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => softDeleteDocument(documentId),
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.removeQueries({ queryKey: documentKeys.detail(documentId) });
    },
  });
}

